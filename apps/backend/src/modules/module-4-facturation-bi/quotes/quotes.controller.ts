import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PdfService } from '../pdf/pdf.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotesService.create(dto);
  }

  @Get()
  findAll() {
    return this.quotesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string) {
    const quote = await this.quotesService.findOne(id);
    const buffer = await this.pdfService.generate({
      documentTitle: 'DEVIS',
      number: quote.number,
      issueDate: quote.issueDate,
      secondaryDate: quote.validUntil ? { label: "Valable jusqu'au", value: quote.validUntil } : null,
      tenant: quote.tenant,
      contact: quote.contact,
      lines: quote.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
      })),
      notes: quote.notes,
    });
    return new StreamableFile(buffer, {
      disposition: `inline; filename="${quote.number}.pdf"`,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quotesService.update(id, dto);
  }

  @Post(':id/validate')
  validate(@Param('id') id: string) {
    return this.quotesService.validate(id);
  }

  @Post(':id/convert')
  convert(@Param('id') id: string) {
    return this.quotesService.convertToInvoice(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quotesService.remove(id);
  }
}
