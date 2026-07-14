import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PlanGuard } from '../../../shared/plan/plan.guard';
import { RequirePlan } from '../../../shared/plan/require-plan.decorator';
import { FollowUpGeneratorService } from './follow-up-generator.service';

@Controller('copilot/follow-up')
@UseGuards(PlanGuard)
@RequirePlan('PRO')
export class FollowUpGeneratorController {
  constructor(private readonly followUpGeneratorService: FollowUpGeneratorService) {}

  @Post(':contactId')
  generate(@Param('contactId') contactId: string) {
    return this.followUpGeneratorService.generate(contactId);
  }
}
