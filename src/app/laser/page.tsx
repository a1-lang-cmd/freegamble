"use client";

import { useState } from "react";
import { Crosshair } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

export default function LaserPage() {
  const [bet, setBet] = useState(100);
  const [charge, setCharge] = useState(50);
  const [result, setResult] = useState(0);
  const [message, setMessage] = useState("Set laser charge. Higher charge is harder and pays more.");
  const multiplier = Number((1 + charge / 22).toFixed(2));

  const fire = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const hit = Math.floor(Math.random() * 100);
    setResult(hit);
    if (hit <= 100 - charge) {
      const payout = Math.floor(check.bet * multiplier);
      addCoins(payout);
      setMessage(`Hit score ${hit}. Won ${payout.toLocaleString()} fake coins.`);
    } else {
      setMessage(`Hit score ${hit}. Laser missed.`);
    }
  };

  return (
    <GameShell eyebrow="Laser" title="Laser Shot" description="Charge the laser and try to land inside the safe hit window.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[340px] place-items-center bg-[#20284e]/90">
          <div className="text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-neon"><Crosshair size={72} /></div>
            <p className="mt-8 text-6xl font-black text-white">{result}</p>
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div className="flex justify-between text-sm font-bold text-slate-300"><span>Charge {charge}</span><span>{multiplier}x</span></div>
          <input type="range" min={5} max={90} value={charge} onChange={(event) => setCharge(Number(event.target.value))} className="w-full accent-cyan-300" />
          <Button onClick={fire} className="w-full">Fire Laser</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
