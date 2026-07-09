import type { ReactNode } from "react";
import { KanbanSquare, ShieldCheck, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Un devis rédigé en 10 secondes",
    text: "Décrivez la prestation en une phrase, le Copilot IA structure le devis à votre place.",
  },
  {
    icon: KanbanSquare,
    title: "Ne ratez plus jamais un prospect",
    text: "Un pipeline visuel qui vous montre exactement où concentrer vos efforts, aujourd'hui.",
  },
  {
    icon: ShieldCheck,
    title: "Vos données, verrouillées par design",
    text: "Isolation stricte entre chaque client — la sécurité n'est pas une option, c'est l'architecture.",
  },
];

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] shrink-0 overflow-hidden bg-[oklch(0.22_0.05_267)] lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(720px 420px at 15% 8%, color-mix(in oklch, var(--primary) 55%, transparent), transparent 65%), radial-gradient(520px 360px at 100% 100%, color-mix(in oklch, var(--ai) 35%, transparent), transparent 60%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, white 100%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, white 100%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white backdrop-blur">
            S
          </span>
          <span className="text-sm font-bold tracking-tight text-white">Smart CRM Copilot</span>
        </div>

        <div className="relative flex flex-col gap-8">
          <h2 className="max-w-sm text-3xl leading-tight font-bold text-balance text-white">
            Moins de paperasse.
            <br />
            Plus de clients signés.
          </h2>
          <div className="flex flex-col gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur">
                  <f.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{f.title}</div>
                  <div className="text-sm text-white/60">{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          Conçu pour les freelances et petites agences qui n&apos;ont pas de temps à perdre.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12">
        {children}
      </div>
    </div>
  );
}
