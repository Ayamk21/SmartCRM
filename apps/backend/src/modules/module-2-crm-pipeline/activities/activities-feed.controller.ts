import { Controller, Get, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesFeedController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('recent')
  findRecent(@Query('limit') limit?: string) {
    return this.activitiesService.findRecent(limit ? Number(limit) : undefined);
  }
}
