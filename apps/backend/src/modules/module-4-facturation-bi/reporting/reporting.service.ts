import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

interface LineLike {
  quantity: number;
  unitPrice: unknown;
}

function documentTotal(doc: { lines: LineLike[] }) {
  return doc.lines.reduce((sum, line) => sum + line.quantity * Number(line.unitPrice), 0);
}

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [deals, invoices, pendingQuotes] = await Promise.all([
      this.prisma.db.deal.findMany(),
      this.prisma.db.invoice.findMany({ include: { lines: true } }),
      this.prisma.db.quote.findMany({
        where: { status: { in: ['DRAFT', 'VALIDATED'] } },
        include: { lines: true },
      }),
    ]);

    const won = deals.filter((d) => d.status === 'GAGNE');
    const lost = deals.filter((d) => d.status === 'PERDU');
    const conversionRate =
      won.length + lost.length > 0
        ? Math.round((won.length / (won.length + lost.length)) * 100)
        : 0;

    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const outstandingInvoices = invoices.filter((i) => i.status !== 'PAID');

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('fr-FR', { month: 'short' }), amount: 0 };
    });

    for (const invoice of paidInvoices) {
      const issued = new Date(invoice.issueDate);
      const bucket = months.find(
        (m) => m.year === issued.getFullYear() && m.month === issued.getMonth(),
      );
      if (bucket) {
        bucket.amount += documentTotal(invoice);
      }
    }

    return {
      monthlyRevenue: months.map((m) => ({ month: m.label, amount: Math.round(m.amount) })),
      totalRevenue: paidInvoices.reduce((sum, i) => sum + documentTotal(i), 0),
      conversionRate,
      wonCount: won.length,
      lostCount: lost.length,
      outstandingAmount: outstandingInvoices.reduce((sum, i) => sum + documentTotal(i), 0),
      pendingQuotesCount: pendingQuotes.length,
      pendingQuotesAmount: pendingQuotes.reduce((sum, q) => sum + documentTotal(q), 0),
    };
  }
}
