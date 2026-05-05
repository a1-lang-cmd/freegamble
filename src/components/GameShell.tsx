import type { ReactNode } from "react";
import { FakeValueNotice } from "@/components/FakeValueNotice";

type GameShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
};

export function GameShell({ title, eyebrow, description, children }: GameShellProps) {
  return (
    <div className="min-w-0 space-y-6">
      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-cyan-200">{eyebrow}</p>
          <h1 className="text-3xl font-black text-white sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{description}</p>
        </div>
        <FakeValueNotice />
      </section>
      {children}
    </div>
  );
}
