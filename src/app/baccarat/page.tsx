"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type Pick = "player" | "banker" | "tie";
const picks: Pick[] = ["player", "banker", "tie"];

function drawHand() {
  const cards = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
  if (Math.random() < 0.42) cards.push(Math.floor(Math.random() * 10));
  return { cards, total: cards.reduce((sum, card) => sum + card, 0) % 10 };
}

export default function BaccaratPage() {
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState<Pick>("player");
  const [player, setPlayer] = useState(drawHand());
  const [banker, setBanker] = useState(drawHand());
  const [message, setMessage] = useState("Pick Player, Banker, or Tie. Fake coins only.");

  const deal = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    removeCoins(check.bet);
    const nextPlayer = drawHand();
    const nextBanker = drawHand();
    setPlayer(nextPlayer);
    setBanker(nextBanker);
    const winner: Pick = nextPlayer.total === nextBanker.total ? "tie" : nextPlayer.total > nextBanker.total ? "player" : "banker";
    const multiplier = winner === "tie" ? 8 : winner === "banker" ? 1.95 : 2;
    if (winner === pick) {
      const payout = Math.floor(check.bet * multiplier);
      addCoins(payout);
      setMessage(`${winner.toUpperCase()} wins. ${payout.toLocaleString()} fake coins returned.`);
    } else {
      setMessage(`${winner.toUpperCase()} wins. Fake bet lost.`);
    }
  };

  return (
    <GameShell eyebrow="Baccarat" title="Neon Baccarat" description="A fast fake-coin table game: Player, Banker, or Tie.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid gap-4 bg-[#252e63]/90 sm:grid-cols-2">
          {[["Player", player], ["Banker", banker]].map(([label, hand]) => {
            const typed = hand as { cards: number[]; total: number };
            return (
              <div key={String(label)} className="rounded-xl border border-white/10 bg-slate-950/35 p-5 text-center">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">{String(label)}</p>
                <div className="mt-5 flex justify-center gap-2">
                  {typed.cards.map((card, index) => (
                    <div key={index} className="grid h-20 w-14 place-items-center rounded-lg bg-white text-2xl font-black text-slate-950">{card}</div>
                  ))}
                </div>
                <p className="mt-5 text-5xl font-black text-white">{typed.total}</p>
              </div>
            );
          })}
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-purple-300" />
          <div className="grid grid-cols-3 gap-2">
            {picks.map((item) => (
              <button key={item} onClick={() => setPick(item)} className={cn("rounded-lg border px-2 py-3 text-sm font-black uppercase", pick === item ? "border-purple-200 bg-purple-300/15 text-white" : "border-white/10 bg-white/5 text-slate-300")}>{item}</button>
            ))}
          </div>
          <Button onClick={deal} variant="secondary" className="w-full"><Landmark size={18} /> Deal</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
