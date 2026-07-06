import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
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

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const { tenant, user } = await this.prisma.raw.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.tenantName, plan: 'FREE' },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });
      return { tenant, user };
    });

    const tokens = await this.issueSession(user.id, user.tenantId, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.raw.user.findUnique({
      where: { email: dto.email },
    });
    const passwordValid = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const tokens = await this.issueSession(user.id, user.tenantId, user.role);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.raw.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalide ou expiree.');
    }

    // Rotation : l'ancien refresh token est immediatement invalide.
    await this.prisma.raw.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(
      session.user.id,
      session.user.tenantId,
      session.user.role,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.raw.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
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
