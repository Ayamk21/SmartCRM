"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ContactType = "LEAD" | "CLIENT";

export interface ContactFormValues {
  type: ContactType;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
}

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  type: "LEAD",
  firstName: "",
  lastName: "",
  company: "",
  title: "",
  email: "",
  phone: "",
  notes: "",
};

export function ContactFormFields({
  value,
  onChange,
}: {
  value: ContactFormValues;
  onChange: (patch: Partial<ContactFormValues>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Type</Label>
        <Select
          value={value.type}
          onValueChange={(v) => v && onChange({ type: v as ContactType })}
        >
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LEAD">Lead (prospect)</SelectItem>
            <SelectItem value="CLIENT">Client</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            required
            value={value.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={value.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Entreprise</Label>
          <Input
            id="company"
            value={value.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Fonction</Label>
          <Input
            id="title"
            value={value.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </>
  );
}
