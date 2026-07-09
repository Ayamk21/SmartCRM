import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

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
}
