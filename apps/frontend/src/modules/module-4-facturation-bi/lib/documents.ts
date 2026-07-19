import { toast } from "sonner";
import { apiFetchBlob } from "@/lib/api";

export type QuoteStatus = "DRAFT" | "VALIDATED" | "CONVERTED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID";

export interface DocumentLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validé",
  CONVERTED: "Converti",
};

export const QUOTE_STATUS_STYLE: Record<QuoteStatus, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  VALIDATED: "bg-chart-2/15 text-chart-2",
  CONVERTED: "bg-success/15 text-success",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PAID: "Payée",
};

export const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  SENT: "bg-chart-2/15 text-chart-2",
  PAID: "bg-success/15 text-success",
};

export function lineTotal(line: { quantity: number; unitPrice: string | number }) {
  return line.quantity * Number(line.unitPrice);
}

export function documentTotal(lines: DocumentLine[]) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

export async function downloadDocument(path: string, accessToken: string | null) {
  try {
    const blob = await apiFetchBlob(path, { accessToken });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Impossible de générer le PDF.");
  }
}
