import { Body, Controller, Get, Header, Param, Patch, StreamableFile } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(@Param('id') id: string) {
    const invoice = await this.invoicesService.findOne(id);
    const buffer = await this.pdfService.generate({
      documentTitle: 'FACTURE',
      number: invoice.number,
      issueDate: invoice.issueDate,
      secondaryDate: invoice.dueDate ? { label: "Échéance :", value: invoice.dueDate } : null,
      tenant: invoice.tenant,
      contact: invoice.contact,
      lines: invoice.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
      })),
      notes: invoice.notes,
    });
    return new StreamableFile(buffer, {
      disposition: `inline; filename="${invoice.number}.pdf"`,
    });
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicesService.updateStatus(id, dto);
  }
}
