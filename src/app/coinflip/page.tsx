"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type Side = "heads" | "tails";

export default function CoinflipPage() {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState<Side>("heads");
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [spin, setSpin] = useState(0);
  const [message, setMessage] = useState("Call the coin. Winning pays 2x in fake coins.");

  const flip = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setFlipping(true);
    setResult(null);
    setSpin((current) => current + 1440);

    window.setTimeout(() => {
      const outcome: Side = Math.random() < 0.5 ? "heads" : "tails";
      setResult(outcome);
      setFlipping(false);
      if (outcome === pick) {
        const payout = check.bet * 2;
        addCoins(payout);
        setMessage(`${outcome.toUpperCase()} landed. Won ${payout.toLocaleString()} fake coins.`);
      } else {
        setMessage(`${outcome.toUpperCase()} landed. Fake bet lost.`);
      }
    }, 950);
  };

  return (
    <GameShell eyebrow="Coinflip" title="Heads or Tails" description="A fast fake-coin flip with clean 2x social casino payouts.">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="grid min-h-[420px] place-items-center">
          <motion.div animate={{ rotateY: spin }} transition={{ duration: 0.9, ease: "easeOut" }} className="grid h-56 w-56 place-items-center rounded-full border-4 border-amber-200/50 bg-amber-300/15 text-amber-100 shadow-purple">
            <div className="text-center">
              <Coins className="mx-auto mb-3" size={64} />
              <p className="text-3xl font-black">{result ? result.toUpperCase() : "FLIP"}</p>
            </div>
          </motion.div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-amber-300" />
          <div className="grid grid-cols-2 gap-2">
            {(["heads", "tails"] as Side[]).map((side) => (
              <button key={side} onClick={() => setPick(side)} className={cn("rounded-lg border px-3 py-3 text-sm font-black uppercase transition", pick === side ? "border-amber-200 bg-amber-300/15 text-white" : "border-white/10 bg-white/5 text-slate-300")}>
                {side}
              </button>
            ))}
          </div>
          <Button onClick={flip} disabled={flipping} variant="secondary" className="w-full">Flip Coin</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
