"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LineDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

export const EMPTY_LINE: LineDraft = { description: "", quantity: "1", unitPrice: "" };

export function QuoteLinesEditor({
  lines,
  onChange,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
}) {
  function updateLine(index: number, patch: Partial<LineDraft>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  function addLine() {
    onChange([...lines, { ...EMPTY_LINE }]);
  }
  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-2.5">
      <Label>Lignes</Label>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(i, { description: e.target.value })}
            className="flex-1"
            required
          />
          <Input
            type="number"
            min="0"
            step="1"
            value={line.quantity}
            onChange={(e) => updateLine(i, { quantity: e.target.value })}
            className="w-16"
            required
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Prix"
            value={line.unitPrice}
            onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
            className="w-24"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeLine(i)}
            disabled={lines.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addLine}>
        <Plus className="h-3.5 w-3.5" />
        Ajouter une ligne
      </Button>
      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2 text-sm">
        <span className="font-medium text-muted-foreground">Total</span>
        <span className="font-mono font-semibold">{total.toLocaleString("fr-FR")} €</span>
      </div>
    </div>
  );
}
