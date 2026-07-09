import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminTenantsService } from './admin-tenants.service';

@Module({
  controllers: [AdminController],
  providers: [AdminTenantsService],
})
export class AdminModule {}
