"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, BadgeDollarSign } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function drawCard() {
  return Math.floor(Math.random() * ranks.length);
}

export default function HiloPage() {
  const [bet, setBet] = useState(100);
  const [activeBet, setActiveBet] = useState(0);
  const [card, setCard] = useState(drawCard());
  const [streak, setStreak] = useState(0);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("Start a round, then guess if the next card is higher or lower.");

  const multiplier = Number((1 + streak * 0.55 + streak ** 1.25 * 0.18).toFixed(2));

  const start = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    removeCoins(check.bet);
    setActiveBet(check.bet);
    setCard(drawCard());
    setStreak(0);
    setActive(true);
    setMessage("Guess higher or lower. Cash out after any correct pick.");
  };

  const guess = (direction: "higher" | "lower") => {
    if (!active) return;
    const nextCard = drawCard();
    const won = direction === "higher" ? nextCard >= card : nextCard <= card;
    setCard(nextCard);
    if (!won) {
      setActive(false);
      setActiveBet(0);
      setStreak(0);
      setMessage(`${ranks[nextCard]} hit. Fake bet lost.`);
      return;
    }

    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setMessage(`${ranks[nextCard]} hit. Correct pick ${nextStreak}. Current cashout: ${Math.floor(activeBet * (1 + nextStreak * 0.55 + nextStreak ** 1.25 * 0.18)).toLocaleString()}.`);
  };

  const cashOut = () => {
    if (!active || streak === 0) return;
    const payout = Math.floor(activeBet * multiplier);
    addCoins(payout);
    setActive(false);
    setActiveBet(0);
    setStreak(0);
    setMessage(`Cashed out for ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
  };

  return (
    <GameShell eyebrow="Hi-Lo" title="Neon Hi-Lo" description="Guess whether the next card is higher or lower. Streaks build fake-coin multipliers.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[360px] place-items-center overflow-hidden bg-[#252e63]/90">
          <div className="grid h-56 w-40 place-items-center rounded-2xl border border-white/20 bg-slate-50 text-slate-950 shadow-purple">
            <div className="text-center">
              <p className="text-7xl font-black">{ranks[card]}</p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Current</p>
            </div>
          </div>
        </Card>
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Streak</p>
              <p className="mt-2 text-3xl font-black text-white">{streak}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Multiplier</p>
              <p className="mt-2 text-3xl font-black text-cyan-100">{multiplier}x</p>
            </div>
          </div>
          <input type="number" min={1} value={bet} disabled={active} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          {!active ? (
            <Button onClick={start} className="w-full"><BadgeDollarSign size={18} /> Start Round</Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => guess("higher")}><ArrowUp size={18} /> Higher</Button>
              <Button onClick={() => guess("lower")} variant="secondary"><ArrowDown size={18} /> Lower</Button>
            </div>
          )}
          <Button onClick={cashOut} disabled={!active || streak === 0} variant="ghost" className="w-full">Cash Out</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
