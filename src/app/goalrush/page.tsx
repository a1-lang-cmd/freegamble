"use client";

import { useState } from "react";
import { Goal } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const lanes = ["Left", "Center", "Right"] as const;

export default function GoalRushPage() {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState<(typeof lanes)[number]>("Center");
  const [keeper, setKeeper] = useState<(typeof lanes)[number] | null>(null);
  const [message, setMessage] = useState("Pick a lane and shoot. Avoid the keeper to win 2x fake coins.");

  const shoot = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    removeCoins(check.bet);
    const save = lanes[Math.floor(Math.random() * lanes.length)];
    setKeeper(save);
    if (save !== pick) {
      const payout = check.bet * 2;
      addCoins(payout);
      setMessage(`Keeper dove ${save}. Goal! Won ${payout.toLocaleString()} fake coins.`);
    } else {
      setMessage(`Keeper guessed ${save}. Shot saved.`);
    }
  };

  return (
    <GameShell eyebrow="Goal Rush" title="Penalty Goal Rush" description="A quick sports-style fake-coin game: pick a lane and beat the keeper.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center bg-[#252e63]/90">
          <div className="grid w-full max-w-xl grid-cols-3 gap-3">
            {lanes.map((lane) => (
              <div key={lane} className={cn("grid aspect-[.72] place-items-center rounded-xl border text-center font-black", keeper === lane ? "border-rose-300 bg-rose-500/20 text-rose-100" : pick === lane ? "border-green-300 bg-green-400/20 text-green-100" : "border-white/10 bg-white/5 text-slate-300")}>
                <div>
                  <Goal className="mx-auto mb-3" />
                  {lane}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-green-300" />
          <div className="grid grid-cols-3 gap-2">
            {lanes.map((lane) => <button key={lane} onClick={() => setPick(lane)} className={cn("rounded-lg border px-2 py-3 text-sm font-black", pick === lane ? "border-green-200 bg-green-300/15 text-white" : "border-white/10 bg-white/5 text-slate-300")}>{lane}</button>)}
          </div>
          <Button onClick={shoot} variant="secondary" className="w-full">Shoot</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
