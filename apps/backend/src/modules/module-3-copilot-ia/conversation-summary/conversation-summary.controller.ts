import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlanGuard } from '../../../shared/plan/plan.guard';
import { RequirePlan } from '../../../shared/plan/require-plan.decorator';
import { ConversationSummaryService } from './conversation-summary.service';
import { SummarizeConversationDto } from './dto/summarize-conversation.dto';

@Controller('copilot/conversation-summary')
@UseGuards(PlanGuard)
@RequirePlan('PRO')
export class ConversationSummaryController {
  constructor(private readonly conversationSummaryService: ConversationSummaryService) {}

  @Post()
  summarize(@Body() dto: SummarizeConversationDto) {
    return this.conversationSummaryService.summarize(dto);
  }
}
