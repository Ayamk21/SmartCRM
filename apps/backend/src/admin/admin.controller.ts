import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminTenantsService } from './admin-tenants.service';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { PlatformAdminGuard } from './guards/platform-admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminTenantsService: AdminTenantsService) {}

  @UseGuards(PlatformAdminGuard)
  @Get('tenants')
  listTenants() {
    return this.adminTenantsService.listTenants();
  }

  @UseGuards(PlatformAdminGuard)
  @Patch('tenants/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.adminTenantsService.updateStatus(id, dto);
  }
}
