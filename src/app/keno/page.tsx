"use client";

import { useState } from "react";
import { Grid3X3 } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const spots = Array.from({ length: 40 }, (_, index) => index + 1);

function drawNumbers() {
  const pool = [...spots];
  const picked: number[] = [];
  while (picked.length < 10) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function payoutMultiplier(picks: number, hits: number) {
  if (hits === 0) return 0;
  return Number(Math.max(0, hits ** 2.15 / Math.max(1, picks * 0.72)).toFixed(2));
}

export default function KenoPage() {
  const [bet, setBet] = useState(100);
  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [message, setMessage] = useState("Pick 1 to 10 numbers, then draw.");

  const toggle = (spot: number) => {
    setDrawn([]);
    setSelected((current) => {
      if (current.includes(spot)) return current.filter((item) => item !== spot);
      if (current.length >= 10) return current;
      return [...current, spot].sort((a, b) => a - b);
    });
  };

  const play = () => {
    if (selected.length === 0) {
      setMessage("Pick at least one number.");
      return;
    }
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    const nextDraw = drawNumbers();
    const hits = selected.filter((item) => nextDraw.includes(item)).length;
    const multiplier = payoutMultiplier(selected.length, hits);
    const payout = Math.floor(check.bet * multiplier);
    if (payout > 0) addCoins(payout);
    setDrawn(nextDraw);
    setMessage(`${hits} hit${hits === 1 ? "" : "s"} from ${selected.length} picks. ${payout.toLocaleString()} fake coins returned at ${multiplier}x.`);
  };

  return (
    <GameShell eyebrow="Keno" title="Neon Keno" description="Pick up to 10 numbers. Ten random numbers draw for fake-coin payouts.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden bg-[#252e63]/90">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {spots.map((spot) => {
              const chosen = selected.includes(spot);
              const hit = drawn.includes(spot);
              return (
                <button
                  key={spot}
                  onClick={() => toggle(spot)}
                  className={cn(
                    "aspect-square rounded-lg border text-sm font-black transition sm:text-base",
                    chosen ? "border-cyan-300 bg-cyan-300/15 text-white shadow-neon" : "border-white/10 bg-white/5 text-slate-300",
                    hit && "border-green-300 bg-green-400/20 text-green-100 shadow-green",
                    hit && chosen && "border-amber-200 bg-amber-300/25 text-white"
                  )}
                >
                  {spot}
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
              <Grid3X3 />
            </div>
            <div>
              <p className="text-xl font-black text-white">{selected.length}/10 picked</p>
              <p className="text-sm text-slate-400">Draws 10 numbers</p>
            </div>
          </div>
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <Button onClick={play} className="w-full">Draw Keno</Button>
          <button onClick={() => { setSelected([]); setDrawn([]); }} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-300">Clear Picks</button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
