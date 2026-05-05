"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const options = [
  { name: "Cyan", color: "bg-cyan-300", multiplier: 2 },
  { name: "Purple", color: "bg-purple-300", multiplier: 3 },
  { name: "Gold", color: "bg-amber-300", multiplier: 5 },
  { name: "Rose", color: "bg-rose-300", multiplier: 8 }
];

export default function ColorPickPage() {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState(options[0].name);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState("Pick a color. Rarer colors pay more fake coins.");

  const play = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const weights = [40, 28, 20, 12];
    const roll = Math.random() * 100;
    let sum = 0;
    const outcome = options.find((option, index) => {
      sum += weights[index];
      return roll <= sum;
    }) ?? options[0];
    setResult(outcome.name);
    if (outcome.name === pick) {
      const payout = Math.floor(check.bet * outcome.multiplier);
      addCoins(payout);
      setMessage(`${outcome.name} hit. Won ${payout.toLocaleString()} fake coins.`);
    } else {
      setMessage(`${outcome.name} hit. Fake bet lost.`);
    }
  };

  return (
    <GameShell eyebrow="Color Pick" title="Color Pick" description="Choose a weighted color and reveal the result.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[340px] place-items-center bg-[#252e63]/90">
          <div className="grid grid-cols-2 gap-4">
            {options.map((option) => (
              <div key={option.name} className={cn("grid h-28 w-28 place-items-center rounded-xl text-slate-950 shadow-purple", option.color, result === option.name && "ring-4 ring-white")}>
                <Palette />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => <button key={option.name} onClick={() => setPick(option.name)} className={cn("rounded-lg border px-3 py-3 text-sm font-black", pick === option.name ? "border-white bg-white/15 text-white" : "border-white/10 bg-white/5 text-slate-300")}>{option.name} {option.multiplier}x</button>)}
          </div>
          <Button onClick={play} className="w-full">Reveal Color</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
