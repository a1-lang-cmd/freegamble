"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Gem, Star } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type SymbolDef = {
  icon: string;
  name: string;
  weight: number;
  payout: number;
  glow: string;
};

type SlotMachine = {
  id: string;
  title: string;
  tagline: string;
  accent: string;
  panel: string;
  symbols: SymbolDef[];
};

const reels = 5;
const rows = 3;
const lineOptions = [1, 3, 5];

const machines: SlotMachine[] = [
  {
    id: "neon-classic",
    title: "Neon Classic",
    tagline: "Bars, sevens, gems, and bright arcade payouts.",
    accent: "text-fuchsia-200",
    panel: "from-fuchsia-500/20 via-cyan-500/10 to-slate-950/20",
    symbols: [
      { icon: "7", name: "Seven", weight: 3, payout: 35, glow: "text-rose-200 shadow-[0_0_18px_rgba(251,113,133,.45)]" },
      { icon: "DIA", name: "Diamond", weight: 6, payout: 18, glow: "text-cyan-200 shadow-neon" },
      { icon: "STAR", name: "Star", weight: 9, payout: 10, glow: "text-amber-200 shadow-purple" },
      { icon: "BAR", name: "Bar", weight: 13, payout: 6, glow: "text-purple-200 shadow-purple" },
      { icon: "CHRY", name: "Cherry", weight: 22, payout: 3, glow: "text-red-200" },
      { icon: "LMN", name: "Lemon", weight: 25, payout: 2, glow: "text-yellow-200" }
    ]
  },
  {
    id: "cyber-vault",
    title: "Cyber Vault",
    tagline: "High-tech symbols with rarer top-end fake-coin hits.",
    accent: "text-cyan-200",
    panel: "from-cyan-500/20 via-blue-500/10 to-slate-950/20",
    symbols: [
      { icon: "KEY", name: "Keycard", weight: 4, payout: 42, glow: "text-cyan-100 shadow-neon" },
      { icon: "CORE", name: "Core", weight: 7, payout: 22, glow: "text-blue-200 shadow-neon" },
      { icon: "CHIP", name: "Chip", weight: 10, payout: 12, glow: "text-purple-200 shadow-purple" },
      { icon: "NODE", name: "Node", weight: 14, payout: 7, glow: "text-green-200 shadow-green" },
      { icon: "BYTE", name: "Byte", weight: 22, payout: 3, glow: "text-slate-100" },
      { icon: "DATA", name: "Data", weight: 27, payout: 2, glow: "text-cyan-300" }
    ]
  },
  {
    id: "gold-rush",
    title: "Gold Rush",
    tagline: "A warmer machine with chunky mid-tier wins.",
    accent: "text-amber-200",
    panel: "from-amber-500/20 via-orange-500/10 to-slate-950/20",
    symbols: [
      { icon: "CROWN", name: "Crown", weight: 4, payout: 30, glow: "text-yellow-100 shadow-purple" },
      { icon: "GOLD", name: "Gold", weight: 8, payout: 16, glow: "text-amber-200 shadow-purple" },
      { icon: "PICK", name: "Pickaxe", weight: 11, payout: 9, glow: "text-orange-200" },
      { icon: "CART", name: "Cart", weight: 14, payout: 6, glow: "text-yellow-200" },
      { icon: "ROCK", name: "Rock", weight: 21, payout: 3, glow: "text-slate-200" },
      { icon: "DUST", name: "Dust", weight: 26, payout: 2, glow: "text-orange-100" }
    ]
  },
  {
    id: "void-fruits",
    title: "Void Fruits",
    tagline: "Fruit-machine pacing with neon dark styling.",
    accent: "text-green-200",
    panel: "from-green-500/20 via-purple-500/10 to-slate-950/20",
    symbols: [
      { icon: "MELN", name: "Melon", weight: 4, payout: 28, glow: "text-green-200 shadow-green" },
      { icon: "PLUM", name: "Plum", weight: 7, payout: 16, glow: "text-purple-200 shadow-purple" },
      { icon: "GRAP", name: "Grape", weight: 11, payout: 9, glow: "text-fuchsia-200" },
      { icon: "BERR", name: "Berry", weight: 15, payout: 5, glow: "text-rose-200" },
      { icon: "LIME", name: "Lime", weight: 23, payout: 3, glow: "text-lime-200" },
      { icon: "SEED", name: "Seed", weight: 27, payout: 2, glow: "text-slate-200" }
    ]
  }
];

const paylines = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2]
];

function rollSymbol(symbols: SymbolDef[]) {
  const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const symbol of symbols) {
    roll -= symbol.weight;
    if (roll <= 0) {
      return symbol;
    }
  }
  return symbols[symbols.length - 1];
}

function makeGrid(symbols: SymbolDef[]) {
  return Array.from({ length: rows }, () => Array.from({ length: reels }, () => rollSymbol(symbols)));
}

function evaluate(grid: SymbolDef[][], activeLines: number, lineBet: number) {
  let payout = 0;
  const winningCells = new Set<string>();
  const messages: string[] = [];

  paylines.slice(0, activeLines).forEach((line, lineIndex) => {
    const lineSymbols = line.map((rowIndex, reelIndex) => grid[rowIndex][reelIndex]);
    const first = lineSymbols[0];
    let matchCount = 1;

    for (let index = 1; index < lineSymbols.length; index += 1) {
      if (lineSymbols[index].name !== first.name) {
        break;
      }
      matchCount += 1;
    }

    if (matchCount >= 3) {
      const linePayout = Math.floor(lineBet * first.payout * (matchCount / 5));
      payout += linePayout;
      messages.push(`Line ${lineIndex + 1}: ${matchCount} ${first.name} paid ${linePayout.toLocaleString()}.`);
      for (let reelIndex = 0; reelIndex < matchCount; reelIndex += 1) {
        winningCells.add(`${line[reelIndex]}-${reelIndex}`);
      }
    }
  });

  return { payout, winningCells, messages };
}

export default function SlotsPage() {
  const [selectedMachine, setSelectedMachine] = useState<SlotMachine | null>(null);
  const [bet, setBet] = useState(50);
  const [activeLines, setActiveLines] = useState(3);
  const [grid, setGrid] = useState<SymbolDef[][]>(() => makeGrid(machines[0].symbols));
  const [spinning, setSpinning] = useState(false);
  const [winningCells, setWinningCells] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState("Pick a free slot machine to open.");

  const machine = selectedMachine ?? machines[0];
  const totalBet = useMemo(() => bet * activeLines, [bet, activeLines]);

  const openMachine = (nextMachine: SlotMachine) => {
    setSelectedMachine(nextMachine);
    setGrid(makeGrid(nextMachine.symbols));
    setWinningCells(new Set());
    setMessage(`${nextMachine.title} loaded. Fake coins only.`);
  };

  const spin = () => {
    const check = validateBet(totalBet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    if (!removeCoins(check.bet)) {
      setMessage("Not enough fake coins for that spin.");
      return;
    }

    setSpinning(true);
    setWinningCells(new Set());
    setMessage("Reels spinning...");

    let ticks = 0;
    const interval = window.setInterval(() => {
      setGrid(makeGrid(machine.symbols));
      ticks += 1;
      if (ticks >= 12) {
        window.clearInterval(interval);
        const finalGrid = makeGrid(machine.symbols);
        const result = evaluate(finalGrid, activeLines, bet);
        setGrid(finalGrid);
        setWinningCells(result.winningCells);
        if (result.payout > 0) {
          addCoins(result.payout);
          setMessage(`Won ${result.payout.toLocaleString()} fake coins. ${result.messages.join(" ")}`);
        } else {
          setMessage("No winning paylines this spin. Fake bet spent.");
        }
        setSpinning(false);
      }
    }, 95);
  };

  return (
    <GameShell eyebrow="Slots" title={selectedMachine ? machine.title : "Slot Machine Lobby"} description="Choose a free social slot machine. Every spin uses fake coins only, with no real-world value.">
      {!selectedMachine ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {machines.map((slotMachine) => (
            <button key={slotMachine.id} onClick={() => openMachine(slotMachine)} className="group text-left">
              <Card className={cn("h-full overflow-hidden bg-gradient-to-br transition duration-300 hover:-translate-y-1 hover:shadow-purple", slotMachine.panel)}>
                <div className="mb-8 grid h-14 w-14 place-items-center rounded-lg border border-white/10 bg-white/10 text-white">
                  <Gem />
                </div>
                <h2 className={cn("text-2xl font-black", slotMachine.accent)}>{slotMachine.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{slotMachine.tagline}</p>
                <p className="mt-6 text-sm font-black text-cyan-100 transition group-hover:text-white">Open machine</p>
              </Card>
            </button>
          ))}
        </section>
      ) : (
        <div className="space-y-5">
          <button
            onClick={() => {
              setSelectedMachine(null);
              setMessage("Pick a free slot machine to open.");
            }}
            disabled={spinning}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Slot selection
          </button>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Card className={cn("relative overflow-hidden bg-gradient-to-br", machine.panel)}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,.24),transparent_34%),radial-gradient(circle_at_70%_80%,rgba(34,211,238,.16),transparent_30%)]" />
              <div className="relative z-10 grid gap-3">
                {grid.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-5 gap-3">
                    {row.map((symbol, reelIndex) => {
                      const winning = winningCells.has(`${rowIndex}-${reelIndex}`);
                      return (
                        <motion.div
                          key={`${rowIndex}-${reelIndex}-${symbol.name}`}
                          initial={{ y: spinning ? -16 : 0, opacity: 0.6 }}
                          animate={{ y: 0, opacity: 1, scale: winning ? [1, 1.08, 1] : 1 }}
                          transition={{ duration: 0.22, repeat: winning ? Infinity : 0, repeatDelay: 0.65 }}
                          className={cn(
                            "grid aspect-square place-items-center rounded-lg border bg-slate-950/70 px-1 text-center text-lg font-black sm:text-2xl",
                            symbol.glow,
                            winning ? "border-green-200 bg-green-400/15 shadow-green" : "border-white/10"
                          )}
                        >
                          {symbol.icon}
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg border border-purple-300/40 bg-purple-500/15 text-purple-100 shadow-purple">
                  <Gem />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{machine.title}</h2>
                  <p className="text-sm text-slate-400">Total bet: {totalBet.toLocaleString()}</p>
                </div>
              </div>

              <label className="block text-sm font-bold text-slate-300" htmlFor="slots-bet">
                Fake coin bet per line
              </label>
              <input
                id="slots-bet"
                type="number"
                min={1}
                value={bet}
                disabled={spinning}
                onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))}
                className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-purple-300"
              />

              <div>
                <p className="mb-2 text-sm font-bold text-slate-300">Paylines</p>
                <div className="grid grid-cols-3 gap-2">
                  {lineOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveLines(option)}
                      disabled={spinning}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-sm font-black transition disabled:opacity-40",
                        activeLines === option ? "border-cyan-200 bg-cyan-300/15 text-white shadow-neon" : "border-white/10 bg-white/5 text-slate-300"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={spin} disabled={spinning} variant="secondary" className="w-full">
                <Star size={18} />
                Spin Reels
              </Button>
              <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-sm font-black text-white">Paytable, 5-match</p>
                <div className="space-y-2 text-sm text-slate-300">
                  {machine.symbols.map((symbol) => (
                    <div key={symbol.name} className="flex justify-between gap-3">
                      <span>{symbol.icon} {symbol.name}</span>
                      <span>{symbol.payout}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </GameShell>
  );
}
