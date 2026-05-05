"use client";

import { useState } from "react";
import { Worm } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const rows = 6;
const cols = 4;

export default function SnakesPage() {
  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);
  const [row, setRow] = useState(0);
  const [snakes, setSnakes] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Climb the jungle. Avoid the snake tile each row.");
  const multiplier = Number((1 + row * 0.55 + row ** 1.4 * 0.15).toFixed(2));

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    setActiveBet(check.bet);
    setRow(0);
    setSnakes(Array.from({ length: rows }, () => Math.floor(Math.random() * cols)));
    setActive(true);
    setMessage("Pick one tile per row. One snake is hidden.");
  };

  const pick = (col: number) => {
    if (!active) return;
    if (snakes[row] === col) {
      setActive(false);
      setMessage("Snake bite. Fake bet lost.");
      return;
    }
    const nextRow = row + 1;
    if (nextRow >= rows) {
      const payout = Math.floor(activeBet * 7.5);
      addCoins(payout);
      setActive(false);
      setMessage(`Escaped the jungle. Won ${payout.toLocaleString()} fake coins.`);
      return;
    }
    setRow(nextRow);
    setMessage(`Safe. Current cashout: ${Math.floor(activeBet * (1 + nextRow * 0.55 + nextRow ** 1.4 * 0.15)).toLocaleString()}.`);
  };

  const cashOut = () => {
    if (!active || row === 0) return;
    const payout = Math.floor(activeBet * multiplier);
    addCoins(payout);
    setActive(false);
    setMessage(`Cashed out ${payout.toLocaleString()} fake coins.`);
  };

  return (
    <GameShell eyebrow="Snakes" title="Snakes" description="Pick safe jungle tiles and avoid the hidden snake.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-[#252e63]/90">
          <div className="mx-auto grid max-w-lg gap-2">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-2">
                {Array.from({ length: cols }).map((__, col) => (
                  <button key={col} onClick={() => rowIndex === row && pick(col)} className={cn("aspect-[1.6] rounded-lg border", rowIndex === row && active ? "border-green-300/50 bg-green-300/15 text-green-100" : "border-white/10 bg-white/5 text-slate-400")}>
                    {rowIndex < row ? "Safe" : <Worm className="mx-auto opacity-50" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} disabled={active} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-green-300" />
          {!active ? <Button onClick={start} variant="secondary" className="w-full">Start Run</Button> : <Button onClick={cashOut} disabled={row === 0} className="w-full">Cash Out {multiplier}x</Button>}
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
