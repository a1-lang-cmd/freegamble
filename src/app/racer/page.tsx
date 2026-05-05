"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const racers = ["Cyan", "Purple", "Green", "Gold"];

export default function RacerPage() {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState("Cyan");
  const [winner, setWinner] = useState<string | null>(null);
  const [message, setMessage] = useState("Pick a racer. Winner pays 4x fake coins.");

  const race = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const result = racers[Math.floor(Math.random() * racers.length)];
    setWinner(result);
    if (result === pick) {
      const payout = check.bet * 4;
      addCoins(payout);
      setMessage(`${result} wins. Won ${payout.toLocaleString()} fake coins.`);
    } else {
      setMessage(`${result} wins. Fake bet lost.`);
    }
  };

  return (
    <GameShell eyebrow="Racer" title="Neon Racer" description="Pick a racer and watch the fake-coin sprint finish.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-3 bg-[#252e63]/90">
          {racers.map((racer) => (
            <div key={racer} className={cn("flex items-center gap-3 rounded-lg border p-3", winner === racer ? "border-green-300 bg-green-300/15" : "border-white/10 bg-white/5")}>
              <Flag className="text-cyan-200" />
              <div className="h-3 flex-1 rounded-full bg-slate-950/60">
                <div className="h-3 rounded-full bg-cyan-300" style={{ width: winner === racer ? "100%" : "35%" }} />
              </div>
              <span className="font-black text-white">{racer}</span>
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div className="grid grid-cols-2 gap-2">
            {racers.map((racer) => <button key={racer} onClick={() => setPick(racer)} className={cn("rounded-lg border px-3 py-3 text-sm font-black", pick === racer ? "border-cyan-200 bg-cyan-300/15 text-white" : "border-white/10 bg-white/5 text-slate-300")}>{racer}</button>)}
          </div>
          <Button onClick={race} className="w-full">Start Race</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
