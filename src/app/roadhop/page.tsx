"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Car, Coins, Rabbit } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type GameState = "idle" | "active" | "lost" | "cashed";
type Difficulty = "easy" | "normal" | "hard";

const cols = 7;
const rows = 8;
const startCol = 3;
const difficultyConfig: Record<Difficulty, { label: string; speeds: number[]; carCounts: number[]; payoutBoost: number }> = {
  easy: {
    label: "Easy",
    speeds: [0, 0.55, -0.65, 0.5, -0.6, 0.72, -0.48, 0],
    carCounts: [0, 1, 2, 1, 2, 1, 2, 0],
    payoutBoost: 0.9
  },
  normal: {
    label: "Normal",
    speeds: [0, 0.82, -1.05, 0.68, -0.92, 1.18, -0.74, 0],
    carCounts: [0, 2, 3, 2, 3, 2, 2, 0],
    payoutBoost: 1
  },
  hard: {
    label: "Hard",
    speeds: [0, 1.05, -1.32, 0.95, -1.22, 1.48, -1.0, 0],
    carCounts: [0, 3, 3, 3, 4, 3, 3, 0],
    payoutBoost: 1.25
  }
};

function laneHazards(difficulty: Difficulty) {
  const { carCounts } = difficultyConfig[difficulty];
  return Array.from({ length: rows }, (_, row) => {
    if (row === 0 || row === rows - 1) return [];
    const count = carCounts[row];
    const spacing = cols / count;
    return Array.from({ length: count }, (__, index) => (index * spacing + row * 0.7) % cols);
  });
}

function wrapPosition(value: number) {
  return ((value % cols) + cols) % cols;
}

function laneHasCarAt(lane: number[], col: number) {
  return lane.some((carCol) => {
    const distance = Math.abs(wrapPosition(carCol) - col);
    return Math.min(distance, cols - distance) < 0.42;
  });
}

export default function RoadHopPage() {
  const [bet, setBet] = useState(100);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [activeBet, setActiveBet] = useState(0);
  const [position, setPosition] = useState({ row: rows - 1, col: startCol });
  const [hazards, setHazards] = useState<number[][]>(() => laneHazards("normal"));
  const [state, setState] = useState<GameState>("idle");
  const [bestRow, setBestRow] = useState(rows - 1);
  const [message, setMessage] = useState("Start a road hop run. Move lane by lane and cash out before getting hit.");

  const config = difficultyConfig[difficulty];
  const progress = rows - 1 - bestRow;
  const multiplier = useMemo(
    () => Number((1 + (progress * 0.38 + progress ** 1.35 * 0.12) * config.payoutBoost).toFixed(2)),
    [config.payoutBoost, progress]
  );
  const payout = Math.floor(activeBet * multiplier);

  const resetBoard = () => {
    setPosition({ row: rows - 1, col: startCol });
    setHazards(laneHazards(difficulty));
    setBestRow(rows - 1);
  };

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setActiveBet(check.bet);
    resetBoard();
    setState("active");
    setMessage(`${config.label} run live. Hop upward, dodge traffic, and cash out after making progress.`);
  };

  const lose = () => {
    setState("lost");
    setActiveBet(0);
    setMessage("Hit by traffic. Fake bet lost.");
  };

  const win = () => {
    const finalPayout = Math.floor(activeBet * Number((6.5 * config.payoutBoost).toFixed(2)));
    addCoins(finalPayout);
    setState("cashed");
    setActiveBet(0);
    setMessage(`Road cleared. Won ${finalPayout.toLocaleString()} fake coins.`);
  };

  const move = (rowDelta: number, colDelta: number) => {
    if (state !== "active") return;

    const next = {
      row: Math.max(0, Math.min(rows - 1, position.row + rowDelta)),
      col: Math.max(0, Math.min(cols - 1, position.col + colDelta))
    };
    setPosition(next);
    setBestRow((current) => Math.min(current, next.row));

    if (laneHasCarAt(hazards[next.row] ?? [], next.col)) {
      lose();
      return;
    }

    if (next.row === 0) {
      win();
      return;
    }

    const nextProgress = rows - 1 - Math.min(bestRow, next.row);
    const nextMultiplier = 1 + (nextProgress * 0.38 + nextProgress ** 1.35 * 0.12) * config.payoutBoost;
    setMessage(`Safe hop. Current cashout: ${Math.floor(activeBet * nextMultiplier).toLocaleString()} fake coins.`);
  };

  const cashOut = () => {
    if (state !== "active" || progress === 0) return;
    addCoins(payout);
    setState("cashed");
    setActiveBet(0);
    setMessage(`Cashed out ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
  };

  useEffect(() => {
    if (state !== "active") return;

    const interval = window.setInterval(() => {
      setHazards((current) =>
        current.map((lane, row) => lane.map((col) => wrapPosition(col + config.speeds[row] * 0.1)))
      );
    }, 100);

    return () => window.clearInterval(interval);
  }, [config.speeds, state]);

  useEffect(() => {
    if (state !== "active") return;
    if (laneHasCarAt(hazards[position.row] ?? [], position.col)) {
      lose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hazards]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") move(-1, 0);
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") move(1, 0);
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") move(0, -1);
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") move(0, 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <GameShell eyebrow="Road Hop" title="Road Hop" description="A Crossy-style lane dodger for fake coins. Hop upward, dodge traffic, and cash out.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden bg-[#252e63]/90">
          <div className="mx-auto grid w-full max-w-xl gap-1 rounded-xl bg-slate-950/30 p-2">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className={cn("relative grid grid-cols-7 gap-1 overflow-hidden", row === 0 || row === rows - 1 ? "bg-green-400/10" : "bg-slate-900/50")}>
                {Array.from({ length: cols }).map((__, col) => {
                  const player = position.row === row && position.col === col;
                  return (
                    <div key={`${row}-${col}`} className="grid aspect-square place-items-center rounded-md border border-white/5 bg-white/5">
                      {player ? <Rabbit className="relative z-20 text-cyan-100" /> : null}
                    </div>
                  );
                })}
                {hazards[row]?.map((carCol, index) => (
                  <div
                    key={`${row}-${index}`}
                    className="pointer-events-none absolute top-1/2 z-10 grid h-[76%] w-[13%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md border border-rose-200/40 bg-rose-500/25 text-rose-100 shadow-purple transition-[left] duration-100 ease-linear"
                    style={{ left: `${((wrapPosition(carCol) + 0.5) / cols) * 100}%` }}
                  >
                    <Car className={config.speeds[row] < 0 ? "rotate-180" : ""} size={22} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Progress</p>
              <p className="mt-2 text-3xl font-black text-white">{progress}/{rows - 1}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Multiplier</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">{multiplier}x</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(difficultyConfig) as Difficulty[]).map((level) => (
                <button
                  key={level}
                  disabled={state === "active"}
                  onClick={() => {
                    setDifficulty(level);
                    setHazards(laneHazards(level));
                    setPosition({ row: rows - 1, col: startCol });
                    setBestRow(rows - 1);
                    setMessage(`${difficultyConfig[level].label} selected. Traffic and payout risk updated.`);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-sm font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
                    difficulty === level
                      ? "border-cyan-300 bg-cyan-300/20 text-cyan-100 shadow-cyan"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50"
                  )}
                >
                  {difficultyConfig[level].label}
                </button>
              ))}
            </div>
          </div>
          <input type="number" min={1} value={bet} disabled={state === "active"} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />

          {state !== "active" ? (
            <Button onClick={start} className="w-full"><Coins size={18} /> Start Run</Button>
          ) : (
            <>
              <div className="mx-auto grid max-w-44 grid-cols-3 gap-2">
                <span />
                <button onClick={() => move(-1, 0)} className="grid h-12 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><ArrowUp /></button>
                <span />
                <button onClick={() => move(0, -1)} className="grid h-12 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><ArrowLeft /></button>
                <button onClick={() => move(1, 0)} className="grid h-12 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><ArrowDown /></button>
                <button onClick={() => move(0, 1)} className="grid h-12 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><ArrowRight /></button>
              </div>
              <Button onClick={cashOut} disabled={progress === 0} variant="secondary" className="w-full">Cash Out</Button>
            </>
          )}
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
