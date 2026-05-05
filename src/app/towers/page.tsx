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
type Difficulty = "Easy" | "Normal" | "Hard";

const rows = 7;
const difficultySettings: Record<Difficulty, { columns: number; safe: number; growth: number; label: string }> = {
  Easy: { columns: 3, safe: 2, growth: 1.42, label: "2 safe tiles per row" },
  Normal: { columns: 2, safe: 1, growth: 1.9, label: "1 safe tile per row" },
  Hard: { columns: 3, safe: 1, growth: 2.72, label: "1 safe tile, bigger multipliers" }
};
const difficulties: Difficulty[] = ["Easy", "Normal", "Hard"];

function createSafeTiles(difficulty: Difficulty) {
  const settings = difficultySettings[difficulty];
  return Array.from({ length: rows }, () => {
    const safeTiles = new Set<number>();
    while (safeTiles.size < settings.safe) {
      safeTiles.add(Math.floor(Math.random() * settings.columns));
    }
    return safeTiles;
  });
}

function rowMultiplier(row: number, difficulty: Difficulty) {
  if (row <= 0) return 1;
  const { columns, safe, growth } = difficultySettings[difficulty];
  const risk = columns / safe;
  return Number((Math.pow(risk, row * 0.92) * Math.pow(growth, row * 0.16)).toFixed(2));
}

export default function TowersPage() {
  const [bet, setBet] = useState(100);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [safeTiles, setSafeTiles] = useState<Array<Set<number>>>(() => createSafeTiles("Easy"));
  const [currentRow, setCurrentRow] = useState(0);
  const [picked, setPicked] = useState<Array<number | null>>(() => Array(rows).fill(null));
  const [state, setState] = useState<GameState>("idle");
  const [message, setMessage] = useState("Start a tower run and climb through safe tiles.");

  const settings = difficultySettings[difficulty];
  const multiplier = useMemo(() => rowMultiplier(currentRow, difficulty), [currentRow, difficulty]);
  const payout = Math.floor(bet * multiplier);

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setSafeTiles(createSafeTiles(difficulty));
    setCurrentRow(0);
    setPicked(Array(rows).fill(null));
    setState("active");
    setMessage(`${difficulty} tower started. ${settings.label}.`);
  };

  const pickTile = (row: number, column: number) => {
    if (state !== "active" || row !== currentRow) {
      return;
    }

    setPicked((existing) => existing.map((value, index) => (index === row ? column : value)));
    if (!safeTiles[row].has(column)) {
      setState("lost");
      setMessage("Wrong tile. Fake bet lost.");
      return;
    }

    const nextRow = currentRow + 1;
    setCurrentRow(nextRow);
    if (nextRow >= rows) {
      const finalPayout = Math.floor(bet * rowMultiplier(rows, difficulty));
      addCoins(finalPayout);
      setState("cashed");
      setMessage(`Tower cleared. Won ${finalPayout.toLocaleString()} fake coins.`);
      return;
    }

    setMessage(`Safe pick. Current cashout is ${Math.floor(bet * rowMultiplier(nextRow, difficulty)).toLocaleString()} fake coins.`);
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
        <Card className="relative min-h-[420px] overflow-hidden bg-[#252e63]/90">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_30%,rgba(59,130,246,.18),transparent_34%),radial-gradient(circle_at_86%_48%,rgba(99,102,241,.22),transparent_24%)]" />
          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col-reverse gap-2 rounded-xl bg-slate-950/25 p-3 sm:gap-3 sm:p-5">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid gap-2 sm:gap-3"
                style={{ gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: settings.columns }).map((__, columnIndex) => {
                  const chosen = picked[rowIndex] === columnIndex;
                  const revealLoss = state === "lost" && picked[rowIndex] !== null;
                  const safe = safeTiles[rowIndex].has(columnIndex);
                  const rowPayout = Math.floor(bet * rowMultiplier(rowIndex + 1, difficulty));
                  return (
                    <motion.button
                      key={columnIndex}
                      whileHover={{ y: state === "active" && rowIndex === currentRow ? -2 : 0 }}
                      onClick={() => pickTile(rowIndex, columnIndex)}
                      className={cn(
                        "grid aspect-[1.7] place-items-center rounded-lg border px-2 text-center text-xs font-black transition sm:aspect-[1.95] sm:text-sm",
                        rowIndex === currentRow && state === "active" ? "border-cyan-300/60 bg-cyan-400/15 text-cyan-100 shadow-neon" : "border-white/10 bg-white/5 text-slate-400",
                        chosen && safe && "border-green-300/60 bg-green-400/20 text-green-100 shadow-green",
                        ((chosen && !safe) || (revealLoss && safe)) && "border-rose-300/60 bg-rose-500/20 text-rose-100"
                      )}
                      aria-label={`Row ${rowIndex + 1} tile ${columnIndex + 1}`}
                    >
                      {chosen && safe ? (
                        <Sparkles className="mx-auto" />
                      ) : chosen && !safe ? (
                        <X className="mx-auto" />
                      ) : (
                        <span>{rowPayout.toLocaleString()}</span>
                      )}
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
          <div>
            <p className="mb-2 text-sm font-bold text-slate-300">Difficulty</p>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-900/35 p-2">
              {difficulties.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    if (state !== "active") {
                      setDifficulty(option);
                      setSafeTiles(createSafeTiles(option));
                      setPicked(Array(rows).fill(null));
                      setCurrentRow(0);
                    }
                  }}
                  disabled={state === "active"}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-black transition disabled:opacity-40",
                    difficulty === option ? "bg-blue-500 text-white shadow-neon" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400">{settings.label}</p>
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
