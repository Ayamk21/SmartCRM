import { Body, Controller, Post } from '@nestjs/common';
import { QuoteGeneratorService } from './quote-generator.service';
import { GenerateQuoteDto } from './dto/generate-quote.dto';

@Controller('copilot/quote-generator')
export class QuoteGeneratorController {
  constructor(private readonly quoteGeneratorService: QuoteGeneratorService) {}

  @Post()
  generate(@Body() dto: GenerateQuoteDto) {
    return this.quoteGeneratorService.generate(dto);
  }
}
