"use client";

import { useMemo, useState } from "react";
import { Bomb, Gem } from "lucide-react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCoins } from "@/hooks/useCoins";
import { cn } from "@/lib/cn";

type TileState = "hidden" | "safe" | "bomb";
type GameState = "idle" | "active" | "lost" | "won";

const tileCount = 25;
const bombCount = 5;

function generateBombs() {
  const bombs = new Set<number>();
  while (bombs.size < bombCount) {
    bombs.add(Math.floor(Math.random() * tileCount));
  }
  return bombs;
}

export default function MinesPage() {
  const { addCoins, removeCoins } = useCoins();
  const [bet, setBet] = useState(100);
  const [bombs, setBombs] = useState<Set<number>>(() => new Set());
  const [revealed, setRevealed] = useState<TileState[]>(() => Array(tileCount).fill("hidden"));
  const [safePicks, setSafePicks] = useState(0);
  const [state, setState] = useState<GameState>("idle");
  const [message, setMessage] = useState("Start a round, then reveal safe tiles.");

  const multiplier = useMemo(() => Number((1 + safePicks * 0.22 + safePicks ** 1.2 * 0.03).toFixed(2)), [safePicks]);
  const payout = Math.floor(bet * multiplier);

  const startRound = () => {
    if (!removeCoins(bet)) {
      setMessage("Not enough fake coins for that bet.");
      return;
    }

    setBombs(generateBombs());
    setRevealed(Array(tileCount).fill("hidden"));
    setSafePicks(0);
    setState("active");
    setMessage("Round live. Each safe tile raises the multiplier.");
  };

  const revealTile = (index: number) => {
    if (state !== "active" || revealed[index] !== "hidden") {
      return;
    }

    if (bombs.has(index)) {
      setRevealed((tiles) => tiles.map((tile, tileIndex) => (bombs.has(tileIndex) ? "bomb" : tile)));
      setState("lost");
      setMessage("Bomb hit. Fake bet lost.");
      return;
    }

    setRevealed((tiles) => tiles.map((tile, tileIndex) => (tileIndex === index ? "safe" : tile)));
    const nextSafePicks = safePicks + 1;
    setSafePicks(nextSafePicks);
    setMessage(`${nextSafePicks} safe tile${nextSafePicks === 1 ? "" : "s"} revealed. Current cashout: ${Math.floor(bet * (1 + nextSafePicks * 0.22 + nextSafePicks ** 1.2 * 0.03)).toLocaleString()}.`);
  };

  const cashOut = () => {
    if (state !== "active" || safePicks === 0) {
      return;
    }

    addCoins(payout);
    setState("won");
    setMessage(`Cashed out for ${payout.toLocaleString()} fake coins at ${multiplier.toFixed(2)}x.`);
  };

  return (
    <GameShell
      eyebrow="Mines"
      title="Pick the Safe Tiles"
      description="A 5x5 grid hides five bombs. Safe reveals grow the multiplier; cash out whenever the board feels hot enough."
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="mx-auto grid w-full max-w-[560px] grid-cols-5 gap-1.5 sm:gap-3">
            {revealed.map((tile, index) => (
              <motion.button
                key={index}
                whileHover={{ y: state === "active" && tile === "hidden" ? -3 : 0 }}
                whileTap={{ scale: state === "active" && tile === "hidden" ? 0.96 : 1 }}
                onClick={() => revealTile(index)}
                className={cn(
                  "aspect-square rounded-lg border text-lg transition sm:text-2xl",
                  tile === "hidden" && "border-slate-600 bg-slate-900/80 hover:border-purple-300/70 hover:bg-purple-400/15",
                  tile === "safe" && "border-green-300/60 bg-green-400/20 text-green-100 shadow-green",
                  tile === "bomb" && "border-rose-300/70 bg-rose-500/20 text-rose-100"
                )}
                aria-label={`Tile ${index + 1}`}
              >
                {tile === "safe" && <Gem className="mx-auto" />}
                {tile === "bomb" && <Bomb className="mx-auto" />}
              </motion.button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Multiplier</p>
              <p className="mt-2 text-2xl font-black text-cyan-100 text-glow-cyan sm:text-3xl">{multiplier.toFixed(2)}x</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Cashout</p>
              <p className="mt-2 break-words text-2xl font-black text-green-100 sm:text-3xl">{payout}</p>
            </div>
          </div>
          <label className="block text-sm font-bold text-slate-300" htmlFor="mines-bet">
            Fake coin bet
          </label>
          <input
            id="mines-bet"
            type="number"
            min={10}
            step={10}
            disabled={state === "active"}
            value={bet}
            onChange={(event) => setBet(Math.max(10, Number(event.target.value) || 10))}
            className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 text-lg font-black text-white outline-none transition focus:border-purple-300"
          />
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={startRound} disabled={state === "active"}>
              Bet
            </Button>
            <Button onClick={cashOut} disabled={state !== "active" || safePicks === 0} variant="secondary">
              Cash Out
            </Button>
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
