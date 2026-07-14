import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesFeedController } from './activities-feed.controller';
import { ActivitiesService } from './activities.service';

@Module({
  controllers: [ActivitiesController, ActivitiesFeedController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
