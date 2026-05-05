"use client";

import { useState } from "react";
import { Package, Skull } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

export default function CratesPage() {
  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);
  const [bad, setBad] = useState(-1);
  const [opened, setOpened] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Open crates and avoid the busted crate.");
  const multiplier = Number((1 + opened.length * 0.6 + opened.length ** 1.25 * 0.22).toFixed(2));

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    setActiveBet(check.bet);
    setBad(Math.floor(Math.random() * 12));
    setOpened([]);
    setActive(true);
    setMessage("Open crates or cash out after a safe crate.");
  };

  const open = (index: number) => {
    if (!active || opened.includes(index)) return;
    if (index === bad) {
      setActive(false);
      setMessage("Busted crate. Fake bet lost.");
      return;
    }
    setOpened((items) => [...items, index]);
    setMessage("Safe crate. Multiplier increased.");
  };

  const cashOut = () => {
    if (!active || opened.length === 0) return;
    const payout = Math.floor(activeBet * multiplier);
    addCoins(payout);
    setActive(false);
    setMessage(`Cashed out ${payout.toLocaleString()} fake coins.`);
  };

  return (
    <GameShell eyebrow="Crates" title="Mystery Crates" description="Open crates, avoid the bust, and cash out fake multipliers.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-[#252e63]/90">
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <button key={index} onClick={() => open(index)} className={cn("grid aspect-square place-items-center rounded-lg border", opened.includes(index) ? "border-green-300 bg-green-300/15 text-green-100" : "border-white/10 bg-white/5 text-slate-300")}>
                {!active && index === bad ? <Skull /> : <Package />}
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} disabled={active} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-purple-300" />
          {!active ? <Button onClick={start} className="w-full">Start Crates</Button> : <Button onClick={cashOut} disabled={!opened.length} variant="secondary" className="w-full">Cash Out {multiplier}x</Button>}
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
