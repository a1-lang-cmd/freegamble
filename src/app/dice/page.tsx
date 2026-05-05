"use client";

import { useMemo, useState } from "react";
import { Dices } from "lucide-react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

export default function DicePage() {
  const [bet, setBet] = useState(100);
  const [target, setTarget] = useState(50);
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState("Roll under your target. Lower targets pay bigger fake multipliers.");
  const multiplier = useMemo(() => Number(((99 / target) * 0.96).toFixed(2)), [target]);

  const play = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setRolling(true);
    setRoll(null);

    window.setTimeout(() => {
      const outcome = Number((Math.random() * 100).toFixed(2));
      setRoll(outcome);
      setRolling(false);
      if (outcome < target) {
        const payout = Math.floor(check.bet * multiplier);
        addCoins(payout);
        setMessage(`Rolled ${outcome}. Won ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
      } else {
        setMessage(`Rolled ${outcome}. Fake bet lost.`);
      }
    }, 700);
  };

  return (
    <GameShell eyebrow="Dice" title="Neon Dice" description="Pick a roll-under target and chase a fake-coin multiplier. No real money, no cashouts.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center overflow-hidden bg-[#252e63]/90">
          <motion.div animate={{ rotate: rolling ? [0, 8, -8, 0] : 0, scale: rolling ? [1, 1.08, 1] : 1 }} transition={{ repeat: rolling ? Infinity : 0, duration: 0.35 }} className="text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-3xl border border-cyan-300/40 bg-cyan-300/10 text-cyan-100 shadow-neon">
              <Dices size={72} />
            </div>
            <p className="mt-8 text-6xl font-black text-white">{roll === null ? "--" : roll}</p>
            <p className="mt-3 text-sm font-bold text-slate-300">Target under {target}</p>
          </motion.div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div>
            <div className="mb-2 flex justify-between text-sm font-bold text-slate-300">
              <span>Roll under</span>
              <span>{multiplier}x</span>
            </div>
            <input type="range" min={2} max={95} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="w-full accent-cyan-300" />
          </div>
          <Button onClick={play} disabled={rolling} className="w-full">Roll Dice</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
