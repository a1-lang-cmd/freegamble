"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

function rollLimbo() {
  const roll = Math.random();
  const value = 1 / Math.max(0.0001, roll);
  return Number(Math.min(10000, value * 0.96).toFixed(value >= 100 ? 0 : 2));
}

export default function LimboPage() {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(2);
  const [result, setResult] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("Pick a target multiplier. The result must clear it.");

  const play = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setPlaying(true);
    setResult(null);

    window.setTimeout(() => {
      const outcome = rollLimbo();
      setResult(outcome);
      setPlaying(false);
      if (outcome >= target) {
        const payout = Math.floor(check.bet * target);
        addCoins(payout);
        setMessage(`${outcome}x hit. Won ${payout.toLocaleString()} fake coins at ${target}x.`);
      } else {
        setMessage(`${outcome}x hit. Fake bet lost.`);
      }
    }, 650);
  };

  return (
    <GameShell eyebrow="Limbo" title="Multiplier Limbo" description="Choose the multiplier to beat. Higher targets are rarer and pay more fake coins.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center overflow-hidden bg-[#20284e]/90">
          <motion.div animate={{ y: playing ? [0, -10, 0] : 0 }} transition={{ repeat: playing ? Infinity : 0, duration: 0.45 }} className="text-center">
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-green-300/40 bg-green-300/10 text-green-100 shadow-green">
              <TrendingUp size={62} />
            </div>
            <p className="mt-8 text-6xl font-black text-white">{result === null ? `${target}x` : `${result}x`}</p>
            <p className="mt-3 text-sm font-bold text-slate-300">Target multiplier</p>
          </motion.div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-green-300" />
          <input type="number" min={1.01} step={0.01} value={target} onChange={(event) => setTarget(Math.max(1.01, Number(event.target.value) || 1.01))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-green-300" />
          <div className="grid grid-cols-4 gap-2">
            {[1.5, 2, 5, 10].map((item) => (
              <button key={item} onClick={() => setTarget(item)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-slate-200">{item}x</button>
            ))}
          </div>
          <Button onClick={play} disabled={playing} variant="secondary" className="w-full">Play Limbo</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
