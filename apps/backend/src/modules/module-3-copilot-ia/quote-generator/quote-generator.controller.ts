import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlanGuard } from '../../../shared/plan/plan.guard';
import { RequirePlan } from '../../../shared/plan/require-plan.decorator';
import { QuoteGeneratorService } from './quote-generator.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';

@Controller('copilot/quote-generator')
@UseGuards(PlanGuard)
@RequirePlan('PRO')
export class QuoteGeneratorController {
  constructor(private readonly quoteGeneratorService: QuoteGeneratorService) {}

  @Post()
  generate(@Body() dto: GenerateQuoteDto) {
    return this.quoteGeneratorService.generate(dto);
  }
}
