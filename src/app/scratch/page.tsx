"use client";

import { useState } from "react";
import { Eraser } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const prizes = [0, 0, 0.5, 1, 2, 3, 5, 10];

export default function ScratchPage() {
  const [bet, setBet] = useState(100);
  const [tiles, setTiles] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>(Array(9).fill(false));
  const [message, setMessage] = useState("Buy a fake scratch card and reveal all nine tiles.");

  const newCard = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    removeCoins(check.bet);
    const winning = prizes[Math.floor(Math.random() * prizes.length)];
    const card = Array.from({ length: 9 }, () => prizes[Math.floor(Math.random() * prizes.length)]);
    const spot = Math.floor(Math.random() * 9);
    card[spot] = winning;
    setTiles(card);
    setRevealed(Array(9).fill(false));
    setMessage("Scratch the tiles. Best revealed prize pays when all tiles are open.");
  };

  const reveal = (index: number) => {
    if (!tiles.length || revealed[index]) return;
    const next = revealed.map((item, itemIndex) => itemIndex === index || item);
    setRevealed(next);
    if (next.every(Boolean)) {
      const best = Math.max(...tiles);
      const payout = Math.floor(bet * best);
      if (payout > 0) addCoins(payout);
      setMessage(`Best tile was ${best}x. ${payout.toLocaleString()} fake coins returned.`);
    }
  };

  return (
    <GameShell eyebrow="Scratchers" title="Neon Scratch Cards" description="Reveal a quick fake-coin scratch card. Best tile wins when the board is cleared.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-[#252e63]/90">
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <button
                key={index}
                onClick={() => reveal(index)}
                className={cn(
                  "aspect-square rounded-lg border text-2xl font-black transition",
                  revealed[index] ? "border-green-300/50 bg-green-300/15 text-green-100" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-neon"
                )}
              >
                {revealed[index] ? `${tiles[index]}x` : <Eraser className="mx-auto" />}
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <Button onClick={newCard} className="w-full">New Scratch Card</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
