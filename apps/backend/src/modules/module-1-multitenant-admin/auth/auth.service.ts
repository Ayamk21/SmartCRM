import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { SwitchCompanyDto } from './dto/switch-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import {
  SetSecurityQuestionsDto,
  VerifySecurityAnswersDto,
} from './dto/security-question.dto';
import { generateTempPassword } from './password-policy';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

interface IssuedTokensWithUser extends IssuedTokens {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    mustChangePassword: boolean;
  };
}

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_PURPOSE = 'password-reset';

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  private readonly refreshTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshTtlDays = Number(
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '30',
    );
  }

  async signup(dto: SignupDto) {
    const existing = await this.prisma.raw.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Cet email est deja utilise.');
    }

    const placeholderPasswordHash = await bcrypt.hash(generateTempPassword(24), 10);

    const { tenant, user } = await this.prisma.raw.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          category: dto.category,
          plan: 'FREE',
          status: 'PENDING',
        },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: placeholderPasswordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });
      await tx.membership.create({
        data: { userId: user.id, tenantId: tenant.id, role: 'ADMIN', isOwner: true },
      });
      return { tenant, user };
    });

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, status: tenant.status },
    };
  }

  async login(dto: LoginDto) {
    const admin = await this.prisma.raw.platformAdmin.findUnique({
      where: { email: dto.email },
    });
    if (admin) {
      const adminPasswordValid = await bcrypt.compare(dto.password, admin.password);
      if (!adminPasswordValid) {
        throw new UnauthorizedException('Identifiants invalides.');
      }
      const accessToken = await this.jwtService.signAsync(
        { sub: admin.id, isPlatformAdmin: true },
        { expiresIn: '2h' },
      );
      return { accessToken, isPlatformAdmin: true as const };
    }

    const user = await this.prisma.raw.user.findUnique({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (user?.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
        throw new ForbiddenException(
          `Compte verrouille suite a plusieurs echecs de connexion. Reessayez dans ${minutesLeft} minute(s).`,
        );
      }
      await this.prisma.raw.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    const passwordValid = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !passwordValid) {
      if (user) {
        await this.registerFailedLoginAttempt(user.id, user.failedLoginAttempts);
      }
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (user.failedLoginAttempts > 0) {
      await this.prisma.raw.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0 },
      });
    }

    if (user.tenant.status === 'PENDING') {
      throw new ForbiddenException(
        'Votre compte est en attente de validation par un administrateur.',
      );
    }
    if (user.tenant.status === 'REJECTED') {
      throw new ForbiddenException("Votre demande d'inscription a ete refusee.");
    }

    const tokens = await this.issueSession(user.id, user.tenantId, user.role);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
      isPlatformAdmin: false as const,
    };
  }

  async refresh(refreshToken: string): Promise<IssuedTokensWithUser> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.raw.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalide ou expiree.');
    }

    await this.prisma.raw.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueSession(
      session.user.id,
      session.user.tenantId,
      session.user.role,
    );
    return {
      ...tokens,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        tenantId: session.user.tenantId,
        mustChangePassword: session.user.mustChangePassword,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.raw.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listCompanies(userId: string) {
    const memberships = await this.prisma.raw.membership.findMany({
      where: { userId },
      include: { tenant: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      tenantId: m.tenantId,
      name: m.tenant.name,
      role: m.role,
      isOwner: m.isOwner,
      status: m.tenant.status,
    }));
  }

  async switchCompany(userId: string, dto: SwitchCompanyDto): Promise<IssuedTokensWithUser> {
    const membership = await this.prisma.raw.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId: dto.tenantId } },
    });
    if (!membership) {
      throw new ForbiddenException("Vous n'appartenez pas a cette societe.");
    }

    await this.prisma.raw.user.update({
      where: { id: userId },
      data: { tenantId: dto.tenantId, role: membership.role },
    });

    const tokens = await this.issueSession(userId, dto.tenantId, membership.role);
    const user = await this.prisma.raw.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async createCompany(userId: string, dto: CreateCompanyDto): Promise<IssuedTokensWithUser> {
    const tenant = await this.prisma.raw.tenant.create({
      data: { name: dto.name, category: dto.category, plan: 'FREE', status: 'ACTIVE' },
    });
    await this.prisma.raw.membership.create({
      data: { userId, tenantId: tenant.id, role: 'ADMIN', isOwner: true },
    });
    return this.switchCompany(userId, { tenantId: tenant.id });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.raw.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }
    const currentValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!currentValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.raw.user.update({
      where: { id: userId },
      data: { password: passwordHash, mustChangePassword: false },
    });
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.raw.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Mot de passe incorrect.');
    }

    if (user.role === 'ADMIN') {
      const currentTenantId = user.tenantId;
      const otherMembership = await this.prisma.raw.membership.findFirst({
        where: { userId, tenantId: { not: currentTenantId } },
      });
      if (otherMembership) {
        await this.prisma.raw.user.update({
          where: { id: userId },
          data: { tenantId: otherMembership.tenantId, role: otherMembership.role },
        });
      }
      await this.prisma.raw.tenant.delete({ where: { id: currentTenantId } });
    } else {
      await this.prisma.raw.user.delete({ where: { id: userId } });
    }
  }

  async setSecurityQuestions(userId: string, dto: SetSecurityQuestionsDto) {
    const entries = await Promise.all(
      dto.questions.map(async (q) => ({
        userId,
        question: q.question,
        answerHash: await bcrypt.hash(normalizeAnswer(q.answer), 10),
      })),
    );

    await this.prisma.raw.$transaction([
      this.prisma.raw.securityQuestion.deleteMany({ where: { userId } }),
      this.prisma.raw.securityQuestion.createMany({ data: entries }),
    ]);

    return { ok: true };
  }

  async getSecurityQuestions(email: string): Promise<{ questions: string[] }> {
    const user = await this.prisma.raw.user.findUnique({
      where: { email },
      include: { securityQuestions: true },
    });
    return { questions: user?.securityQuestions.map((q) => q.question) ?? [] };
  }

  async verifySecurityAnswers(dto: VerifySecurityAnswersDto): Promise<{ resetToken: string }> {
    const user = await this.prisma.raw.user.findUnique({
      where: { email: dto.email },
      include: { securityQuestions: true },
    });

    if (!user || user.securityQuestions.length === 0) {
      throw new UnauthorizedException('Reponses incorrectes.');
    }
    if (dto.answers.length !== user.securityQuestions.length) {
      throw new UnauthorizedException('Reponses incorrectes.');
    }

    for (const provided of dto.answers) {
      const match = user.securityQuestions.find((q) => q.question === provided.question);
      const valid = match
        ? await bcrypt.compare(normalizeAnswer(provided.answer), match.answerHash)
        : false;
      if (!valid) {
        throw new UnauthorizedException('Reponses incorrectes.');
      }
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, purpose: PASSWORD_RESET_TOKEN_PURPOSE },
      { expiresIn: '15m' },
    );
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    let payload: { sub: string; purpose?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.resetToken);
    } catch {
      throw new UnauthorizedException('Lien de reinitialisation invalide ou expire.');
    }
    if (payload.purpose !== PASSWORD_RESET_TOKEN_PURPOSE) {
      throw new UnauthorizedException('Lien de reinitialisation invalide.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.raw.user.update({
      where: { id: payload.sub },
      data: { password: passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.prisma.raw.session.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async registerFailedLoginAttempt(userId: string, currentAttempts: number) {
    const attempts = currentAttempts + 1;
    await this.prisma.raw.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
  }

  private async issueSession(
    userId: string,
    tenantId: string,
    role: string,
  ): Promise<IssuedTokens> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      tenantId,
      role,
    });

    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000,
    );
    await this.prisma.raw.session.create({
      data: { tokenHash: this.hashToken(refreshToken), userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
