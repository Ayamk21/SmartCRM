export type DealStatus = "PROSPECT" | "QUALIFICATION" | "PROPOSITION" | "GAGNE" | "PERDU";

export interface MockContact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
}

export interface MockDeal {
  id: string;
  contactId: string;
  title: string;
  amount: number;
  status: DealStatus;
}

export interface MockActivity {
  id: string;
  contactId: string;
  label: string;
  date: string;
}

export const MOCK_CONTACTS: MockContact[] = [
  {
    id: "julie-martin",
    firstName: "Julie",
    lastName: "Martin",
    company: "Atelier Lumen",
    title: "Directrice artistique",
    email: "julie.martin@atelier-lumen.fr",
    phone: "06 12 34 56 78",
  },
  {
    id: "karim-b",
    firstName: "Karim",
    lastName: "B.",
    company: "DevCraft SARL",
    title: "CTO",
    email: "karim@devcraft.fr",
    phone: "06 98 76 54 32",
  },
  {
    id: "studio-nova",
    firstName: "Nora",
    lastName: "Studio Nova",
    company: "Studio Nova",
    title: "Fondatrice",
    email: "contact@studio-nova.fr",
    phone: "07 11 22 33 44",
  },
  {
    id: "pixel-co",
    firstName: "Marc",
    lastName: "Pixel Co.",
    company: "Pixel Co.",
    title: "Responsable achats",
    email: "marc@pixel.co",
    phone: "06 55 44 33 22",
  },
];

export const MOCK_DEALS: MockDeal[] = [
  { id: "d1", contactId: "studio-nova", title: "Refonte site vitrine", amount: 2400, status: "PROSPECT" },
  { id: "d2", contactId: "julie-martin", title: "Identité visuelle", amount: 890, status: "PROSPECT" },
  { id: "d3", contactId: "karim-b", title: "App mobile MVP", amount: 1650, status: "QUALIFICATION" },
  { id: "d4", contactId: "julie-martin", title: "Devis #0042", amount: 5200, status: "PROPOSITION" },
  { id: "d5", contactId: "karim-b", title: "Maintenance annuelle", amount: 3100, status: "PROPOSITION" },
  { id: "d6", contactId: "studio-nova", title: "Site e-commerce", amount: 2400, status: "GAGNE" },
  { id: "d7", contactId: "pixel-co", title: "Landing page", amount: 760, status: "PERDU" },
];

export const MOCK_ACTIVITIES: MockActivity[] = [
  { id: "a1", contactId: "julie-martin", label: "Devis #0042 envoyé (890 €)", date: "14 juin 2026" },
  { id: "a2", contactId: "julie-martin", label: "Appel de découverte — 25 min, intéressée par l'offre Pro", date: "02 juin 2026" },
  { id: "a3", contactId: "julie-martin", label: "Contact créé depuis le formulaire du site", date: "28 mai 2026" },
];

export const MOCK_MONTHLY_REVENUE = [
  { month: "J", value: 38 },
  { month: "F", value: 52 },
  { month: "M", value: 46 },
  { month: "A", value: 70 },
  { month: "M", value: 61 },
  { month: "J", value: 88 },
];
