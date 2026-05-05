"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Rows3, Sparkles, X } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type GameState = "idle" | "active" | "lost" | "cashed";

const rows = 7;
const columns = 3;

function createSafeTiles() {
  return Array.from({ length: rows }, () => Math.floor(Math.random() * columns));
}

export default function TowersPage() {
  const [bet, setBet] = useState(100);
  const [safeTiles, setSafeTiles] = useState<number[]>(() => createSafeTiles());
  const [currentRow, setCurrentRow] = useState(0);
  const [picked, setPicked] = useState<Array<number | null>>(() => Array(rows).fill(null));
  const [state, setState] = useState<GameState>("idle");
  const [message, setMessage] = useState("Start a tower run and climb through safe tiles.");

  const multiplier = useMemo(() => Number((1 + currentRow * 0.42 + currentRow ** 1.35 * 0.08).toFixed(2)), [currentRow]);
  const payout = Math.floor(bet * multiplier);

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setSafeTiles(createSafeTiles());
    setCurrentRow(0);
    setPicked(Array(rows).fill(null));
    setState("active");
    setMessage("Pick one tile per row. Higher rows raise the fake multiplier.");
  };

  const pickTile = (row: number, column: number) => {
    if (state !== "active" || row !== currentRow) {
      return;
    }

    setPicked((existing) => existing.map((value, index) => (index === row ? column : value)));
    if (safeTiles[row] !== column) {
      setState("lost");
      setMessage("Wrong tile. Fake bet lost.");
      return;
    }

    const nextRow = currentRow + 1;
    setCurrentRow(nextRow);
    if (nextRow >= rows) {
      const finalPayout = Math.floor(bet * 6.5);
      addCoins(finalPayout);
      setState("cashed");
      setMessage(`Tower cleared. Won ${finalPayout.toLocaleString()} fake coins.`);
      return;
    }

    setMessage(`Safe pick. Current cashout is ${Math.floor(bet * (1 + nextRow * 0.42 + nextRow ** 1.35 * 0.08)).toLocaleString()} fake coins.`);
  };

  const cashOut = () => {
    if (state !== "active" || currentRow === 0) {
      return;
    }

    addCoins(payout);
    setState("cashed");
    setMessage(`Cashed out at ${multiplier.toFixed(2)}x for ${payout.toLocaleString()} fake coins.`);
  };

  return (
    <GameShell eyebrow="Towers" title="Climb the Neon Tower" description="Pick one safe tile per row. The tower gets richer as you climb, but a wrong tile loses the fake bet.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="mx-auto flex w-full max-w-md flex-col-reverse gap-2 sm:gap-3">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 sm:gap-3">
                {Array.from({ length: columns }).map((__, columnIndex) => {
                  const chosen = picked[rowIndex] === columnIndex;
                  const revealLoss = state === "lost" && picked[rowIndex] !== null;
                  const safe = safeTiles[rowIndex] === columnIndex;
                  return (
                    <motion.button
                      key={columnIndex}
                      whileHover={{ y: state === "active" && rowIndex === currentRow ? -2 : 0 }}
                      onClick={() => pickTile(rowIndex, columnIndex)}
                      className={cn(
                        "aspect-[1.55] rounded-lg border transition sm:aspect-[1.8]",
                        rowIndex === currentRow && state === "active" ? "border-cyan-300/60 bg-cyan-400/15 shadow-neon" : "border-white/10 bg-white/5",
                        chosen && safe && "border-green-300/60 bg-green-400/20 text-green-100 shadow-green",
                        ((chosen && !safe) || (revealLoss && safe)) && "border-rose-300/60 bg-rose-500/20 text-rose-100"
                      )}
                      aria-label={`Row ${rowIndex + 1} tile ${columnIndex + 1}`}
                    >
                      {chosen && safe && <Sparkles className="mx-auto" />}
                      {chosen && !safe && <X className="mx-auto" />}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Level</p>
              <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{currentRow}/{rows}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Multiplier</p>
              <p className="mt-2 text-2xl font-black text-cyan-100 sm:text-3xl">{multiplier.toFixed(2)}x</p>
            </div>
          </div>
          <input type="number" min={1} value={bet} disabled={state === "active"} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={start} disabled={state === "active"}>
              <Rows3 size={18} />
              Start
            </Button>
            <Button onClick={cashOut} disabled={state !== "active" || currentRow === 0} variant="secondary">Cash Out</Button>
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
