"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

export default function MeteorPage() {
  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);
  const [level, setLevel] = useState(0);
  const [crashAt, setCrashAt] = useState(0);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Survive meteor waves and cash out.");
  const multiplier = Number((1 + level * 0.5 + level ** 1.45 * 0.18).toFixed(2));

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    setActiveBet(check.bet);
    setLevel(0);
    setCrashAt(2 + Math.floor(Math.random() * 12));
    setActive(true);
    setMessage("Wave started. Continue or cash out.");
  };

  const next = () => {
    const wave = level + 1;
    if (wave >= crashAt) {
      setActive(false);
      setLevel(0);
      setMessage("Meteor strike. Fake bet lost.");
      return;
    }
    setLevel(wave);
    setMessage(`Survived wave ${wave}. Current multiplier ${Number((1 + wave * 0.5 + wave ** 1.45 * 0.18).toFixed(2))}x.`);
  };

  const cashOut = () => {
    if (!active || level === 0) return;
    const payout = Math.floor(activeBet * multiplier);
    addCoins(payout);
    setActive(false);
    setLevel(0);
    setMessage(`Cashed out ${payout.toLocaleString()} fake coins.`);
  };

  return (
    <GameShell eyebrow="Meteor" title="Meteor Run" description="Survive waves to grow the fake multiplier, then cash out.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center bg-[#252e63]/90">
          <div className="text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border border-orange-300/40 bg-orange-400/20 text-orange-100 shadow-purple"><Flame size={70} /></div>
            <p className="mt-8 text-6xl font-black text-white">{level}</p>
            <p className="text-sm font-bold text-slate-400">waves survived</p>
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} disabled={active} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-orange-300" />
          {!active ? <Button onClick={start} variant="danger" className="w-full">Start Run</Button> : <Button onClick={next} variant="danger" className="w-full">Next Wave {multiplier}x</Button>}
          <Button onClick={cashOut} disabled={!active || level === 0} variant="secondary" className="w-full">Cash Out</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
