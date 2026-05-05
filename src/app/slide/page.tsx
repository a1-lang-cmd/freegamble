"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

export default function SlidePage() {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [position, setPosition] = useState(50);
  const [message, setMessage] = useState("Choose a target zone. The slider must stop under it.");
  const multiplier = Number((100 / Math.max(5, target) * 0.94).toFixed(2));

  const play = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const stop = Number((Math.random() * 100).toFixed(1));
    setPosition(stop);
    if (stop <= target) {
      const payout = Math.floor(check.bet * multiplier);
      addCoins(payout);
      setMessage(`Stopped at ${stop}. Won ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
    } else {
      setMessage(`Stopped at ${stop}. Fake bet lost.`);
    }
  };

  return (
    <GameShell eyebrow="Slide" title="Multiplier Slide" description="Set the safe zone and spin the neon slider for fake coins.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[340px] place-items-center bg-[#20284e]/90">
          <div className="w-full max-w-2xl">
            <div className="relative h-12 rounded-full bg-slate-950/70">
              <div className="absolute inset-y-0 left-0 rounded-full bg-green-400/25" style={{ width: `${target}%` }} />
              <motion.div animate={{ left: `${position}%` }} className="absolute top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200 bg-cyan-300 text-cyan-950 shadow-neon">
                <SlidersHorizontal />
              </motion.div>
            </div>
            <p className="mt-8 text-center text-4xl font-black text-white">{position}</p>
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div className="flex justify-between text-sm font-bold text-slate-300"><span>Target {target}</span><span>{multiplier}x</span></div>
          <input type="range" min={5} max={95} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-cyan-300" />
          <Button onClick={play} className="w-full">Start Slide</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
