import { Module } from '@nestjs/common';
import { ConversationSummaryController } from './conversation-summary.controller';
import { ConversationSummaryService } from './conversation-summary.service';

@Module({
  controllers: [ConversationSummaryController],
  providers: [ConversationSummaryService],
})
export class ConversationSummaryModule {}
