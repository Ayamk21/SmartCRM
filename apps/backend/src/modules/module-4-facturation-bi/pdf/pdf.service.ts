import { Injectable } from '@nestjs/common';
import { createElement } from 'react';
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

export interface PdfLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface PdfDocumentInput {
  documentTitle: 'DEVIS' | 'FACTURE';
  number: string;
  issueDate: Date;
  secondaryDate?: { label: string; value: Date } | null;
  tenant: {
    name: string;
    logoUrl?: string | null;
    currency: string;
    siret?: string | null;
    pdfTemplate?: string | null;
  };
  contact: {
    firstName: string;
    lastName?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  lines: PdfLine[];
  notes?: string | null;
}

const ACCENT_BY_TEMPLATE: Record<string, string> = {
  classique: '#1f2937',
  moderne: '#4f46e5',
  minimaliste: '#000000',
};

@Injectable()
export class PdfService {
  async generate(input: PdfDocumentInput): Promise<Buffer> {
    const accent = ACCENT_BY_TEMPLATE[input.tenant.pdfTemplate ?? 'classique'] ?? '#1f2937';
    const total = input.lines.reduce(
      (sum, line) => sum + line.quantity * Number(line.unitPrice),
      0,
    );

    const styles = StyleSheet.create({
      page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111827' },
      header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
      logo: { width: 90, height: 90, objectFit: 'contain' },
      tenantName: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
      muted: { color: '#6b7280' },
      docTitle: { fontSize: 22, fontWeight: 700, color: accent, textAlign: 'right' },
      docNumber: { fontSize: 11, textAlign: 'right', marginTop: 2 },
      section: { marginBottom: 20 },
      sectionLabel: {
        fontSize: 9,
        textTransform: 'uppercase',
        color: '#6b7280',
        marginBottom: 4,
        letterSpacing: 0.5,
      },
      tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: accent,
        paddingBottom: 6,
        marginBottom: 6,
      },
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 6,
      },
      colDescription: { flex: 4 },
      colQty: { flex: 1, textAlign: 'right' },
      colPrice: { flex: 1.5, textAlign: 'right' },
      colTotal: { flex: 1.5, textAlign: 'right' },
      totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: accent,
      },
      totalLabel: { fontSize: 12, fontWeight: 700, marginRight: 12 },
      totalValue: { fontSize: 12, fontWeight: 700, color: accent },
      footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#9ca3af' },
    });

    const formatAmount = (value: number) =>
      `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${input.tenant.currency}`;

    const contactName = `${input.contact.firstName} ${input.contact.lastName ?? ''}`.trim();

    const doc = createElement(
      Document,
      null,
      createElement(
        Page,
        { size: 'A4', style: styles.page },
        createElement(
          View,
          { style: styles.header },
          createElement(
            View,
            null,
            input.tenant.logoUrl
              ? createElement(Image, { src: input.tenant.logoUrl, style: styles.logo })
              : null,
            createElement(Text, { style: styles.tenantName }, input.tenant.name),
            input.tenant.siret
              ? createElement(Text, { style: styles.muted }, `SIRET : ${input.tenant.siret}`)
              : null,
          ),
          createElement(
            View,
            null,
            createElement(Text, { style: styles.docTitle }, input.documentTitle),
            createElement(Text, { style: styles.docNumber }, input.number),
            createElement(
              Text,
              { style: [styles.muted, { textAlign: 'right', marginTop: 6 }] },
              `Émis le ${input.issueDate.toLocaleDateString('fr-FR')}`,
            ),
            input.secondaryDate
              ? createElement(
                  Text,
                  { style: [styles.muted, { textAlign: 'right' }] },
                  `${input.secondaryDate.label} ${input.secondaryDate.value.toLocaleDateString('fr-FR')}`,
                )
              : null,
          ),
        ),
        createElement(
          View,
          { style: styles.section },
          createElement(Text, { style: styles.sectionLabel }, 'Destinataire'),
          createElement(Text, {}, contactName),
          input.contact.company ? createElement(Text, { style: styles.muted }, input.contact.company) : null,
          input.contact.email ? createElement(Text, { style: styles.muted }, input.contact.email) : null,
          input.contact.phone ? createElement(Text, { style: styles.muted }, input.contact.phone) : null,
        ),
        createElement(
          View,
          {},
          createElement(
            View,
            { style: styles.tableHeader },
            createElement(Text, { style: styles.colDescription }, 'Description'),
            createElement(Text, { style: styles.colQty }, 'Qté'),
            createElement(Text, { style: styles.colPrice }, 'Prix unitaire'),
            createElement(Text, { style: styles.colTotal }, 'Total'),
          ),
          ...input.lines.map((line) =>
            createElement(
              View,
              { style: styles.tableRow, key: line.description },
              createElement(Text, { style: styles.colDescription }, line.description),
              createElement(Text, { style: styles.colQty }, String(line.quantity)),
              createElement(Text, { style: styles.colPrice }, formatAmount(Number(line.unitPrice))),
              createElement(
                Text,
                { style: styles.colTotal },
                formatAmount(line.quantity * Number(line.unitPrice)),
              ),
            ),
          ),
        ),
        createElement(
          View,
          { style: styles.totalRow },
          createElement(Text, { style: styles.totalLabel }, 'Total'),
          createElement(Text, { style: styles.totalValue }, formatAmount(total)),
        ),
        input.notes
          ? createElement(
              View,
              { style: [styles.section, { marginTop: 24 }] },
              createElement(Text, { style: styles.sectionLabel }, 'Notes'),
              createElement(Text, {}, input.notes),
            )
          : null,
        createElement(
          Text,
          { style: styles.footer },
          `${input.tenant.name}${input.tenant.siret ? ` — SIRET ${input.tenant.siret}` : ''} — Généré via Smart CRM Copilot`,
        ),
      ),
    );

    return renderToBuffer(doc);
  }
}
