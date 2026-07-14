import { Module } from '@nestjs/common';
import { FollowUpGeneratorController } from './follow-up-generator.controller';
import { FollowUpGeneratorService } from './follow-up-generator.service';

@Module({
  controllers: [FollowUpGeneratorController],
  providers: [FollowUpGeneratorService],
})
export class FollowUpGeneratorModule {}
