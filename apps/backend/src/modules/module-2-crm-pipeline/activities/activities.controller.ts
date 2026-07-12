import { Body, Controller, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../module-1-multitenant-admin/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../module-1-multitenant-admin/auth/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('contacts/:contactId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(
    @Param('contactId') contactId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.activitiesService.create(contactId, dto, user.sub);
  }
}
