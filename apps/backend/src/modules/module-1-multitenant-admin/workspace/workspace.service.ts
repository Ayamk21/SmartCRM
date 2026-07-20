import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { EmailService } from '../../../shared/email/email.service';
import { generateTempPassword } from '../auth/password-policy';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getWorkspace(tenantId: string) {
    const tenant = await this.prisma.raw.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant introuvable.');
    }
    return tenant;
  }

  async updateWorkspace(tenantId: string, dto: UpdateWorkspaceDto) {
    await this.getWorkspace(tenantId);
    return this.prisma.raw.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async listMembers(tenantId: string) {
    return this.prisma.raw.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async inviteMember(tenantId: string, dto: InviteMemberDto) {
    const tenant = await this.getWorkspace(tenantId);

    const existing = await this.prisma.raw.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Cet email est deja utilise.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.raw.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        password: passwordHash,
        mustChangePassword: true,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    await this.prisma.raw.membership.create({
      data: { userId: user.id, tenantId, role: dto.role, isOwner: dto.role === 'ADMIN' },
    });

    await this.emailService.sendTeamInviteEmail(dto.email, tenant.name, dto.role, tempPassword);

    return { ...user, tempPassword };
  }

  async removeMember(tenantId: string, userId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new ConflictException('Tu ne peux pas te retirer toi-meme depuis cette page.');
    }
    const member = await this.prisma.raw.user.findFirst({ where: { id: userId, tenantId } });
    if (!member) {
      throw new NotFoundException('Membre introuvable.');
    }
    await this.prisma.raw.user.delete({ where: { id: userId } });
    return { ok: true };
  }
}
