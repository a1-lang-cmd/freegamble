"use client";

import { useState } from "react";
import { Circle } from "lucide-react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

export default function PumpPage() {
  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);
  const [pumps, setPumps] = useState(0);
  const [popAt, setPopAt] = useState(0);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Start pumping. Cash out before the balloon pops.");
  const multiplier = Number((1 + pumps * 0.32 + pumps ** 1.25 * 0.08).toFixed(2));

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    setActiveBet(check.bet);
    setPumps(0);
    setPopAt(3 + Math.floor(Math.random() * 12));
    setActive(true);
    setMessage("Balloon ready. Pump or cash out.");
  };

  const pump = () => {
    const next = pumps + 1;
    if (next >= popAt) {
      setActive(false);
      setActiveBet(0);
      setPumps(0);
      setMessage("Pop! Fake bet lost.");
      return;
    }
    setPumps(next);
    setMessage(`Pump ${next}. Current cashout: ${Math.floor(activeBet * (1 + next * 0.32 + next ** 1.25 * 0.08)).toLocaleString()}.`);
  };

  const cashOut = () => {
    if (!active || pumps === 0) return;
    const payout = Math.floor(activeBet * multiplier);
    addCoins(payout);
    setActive(false);
    setActiveBet(0);
    setPumps(0);
    setMessage(`Cashed out ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
  };

  return (
    <GameShell eyebrow="Pump" title="Neon Pump" description="Inflate the multiplier and cash out before the pop. Fake coins only.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center bg-[#252e63]/90">
          <motion.div animate={{ scale: 1 + pumps * 0.05 }} className="grid h-40 w-40 place-items-center rounded-full border border-rose-200 bg-rose-400/30 text-rose-100 shadow-purple">
            <Circle size={70} />
          </motion.div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} disabled={active} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-rose-300" />
          {!active ? <Button onClick={start} variant="danger" className="w-full">Start Pump</Button> : <Button onClick={pump} variant="danger" className="w-full">Pump {multiplier}x</Button>}
          <Button onClick={cashOut} disabled={!active || pumps === 0} variant="secondary" className="w-full">Cash Out</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
