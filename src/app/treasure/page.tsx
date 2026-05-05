"use client";

import { useState } from "react";
import { Archive, Gem } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

const rewards = [0, 0, 0.5, 1, 2, 4, 8, 15];

export default function TreasurePage() {
  const [bet, setBet] = useState(100);
  const [opened, setOpened] = useState<number | null>(null);
  const [reward, setReward] = useState(0);
  const [message, setMessage] = useState("Pick one treasure chest.");

  const open = (index: number) => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const multiplier = rewards[Math.floor(Math.random() * rewards.length)];
    const payout = Math.floor(check.bet * multiplier);
    if (payout > 0) addCoins(payout);
    setOpened(index);
    setReward(multiplier);
    setMessage(`Chest paid ${multiplier}x. ${payout.toLocaleString()} fake coins returned.`);
  };

  return (
    <GameShell eyebrow="Treasure" title="Treasure Chests" description="Pick a chest and reveal a fake-coin multiplier.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-[#252e63]/90">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <button key={index} onClick={() => open(index)} className="grid aspect-square place-items-center rounded-lg border border-amber-300/30 bg-amber-300/10 text-amber-100">
                {opened === index ? <span className="font-black">{reward}x</span> : <Archive />}
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="grid h-14 w-14 place-items-center rounded-lg border border-amber-300/30 bg-amber-300/10 text-amber-100"><Gem /></div>
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-amber-300" />
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
