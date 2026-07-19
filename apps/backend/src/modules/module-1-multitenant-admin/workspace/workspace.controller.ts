import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  getWorkspace(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaceService.getWorkspace(user.tenantId!);
  }

  @Roles('ADMIN')
  @Patch()
  updateWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(user.tenantId!, dto);
  }

  @Roles('ADMIN')
  @Get('members')
  listMembers(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaceService.listMembers(user.tenantId!);
  }

  @Roles('ADMIN')
  @Post('members')
  inviteMember(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteMemberDto) {
    return this.workspaceService.inviteMember(user.tenantId!, dto);
  }

  @Roles('ADMIN')
  @Delete('members/:id')
  removeMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workspaceService.removeMember(user.tenantId!, id, user.sub);
  }
}
