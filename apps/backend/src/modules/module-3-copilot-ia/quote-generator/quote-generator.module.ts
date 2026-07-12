import { Module } from '@nestjs/common';
import { QuoteGeneratorController } from './quote-generator.controller';
import { QuoteGeneratorService } from './quote-generator.service';

@Module({
  controllers: [QuoteGeneratorController],
  providers: [QuoteGeneratorService],
})
export class QuoteGeneratorModule {}
