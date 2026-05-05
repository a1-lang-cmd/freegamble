"use client";

import { useState } from "react";
import { Club } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7"];
const suits = ["S", "H", "D", "C"];

type CardValue = { rank: string; suit: string };

function drawCard(): CardValue {
  return { rank: ranks[Math.floor(Math.random() * ranks.length)], suit: suits[Math.floor(Math.random() * suits.length)] };
}

function score(hand: CardValue[]) {
  const counts = new Map<string, number>();
  hand.forEach((card) => counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1));
  const values = Array.from(counts.values()).sort((a, b) => b - a);
  if (values[0] === 4) return { name: "Four of a kind", multiplier: 25 };
  if (values[0] === 3 && values[1] === 2) return { name: "Full house", multiplier: 9 };
  if (values[0] === 3) return { name: "Three of a kind", multiplier: 4 };
  if (values[0] === 2 && values[1] === 2) return { name: "Two pair", multiplier: 2 };
  if (values[0] === 2) return { name: "Pair", multiplier: 1 };
  return { name: "No hand", multiplier: 0 };
}

export default function VideoPokerPage() {
  const [bet, setBet] = useState(100);
  const [hand, setHand] = useState<CardValue[]>(() => Array.from({ length: 5 }, drawCard));
  const [held, setHeld] = useState<boolean[]>(Array(5).fill(false));
  const [dealt, setDealt] = useState(false);
  const [message, setMessage] = useState("Deal, hold cards, then draw for fake-coin poker payouts.");

  const deal = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    removeCoins(check.bet);
    setHand(Array.from({ length: 5 }, drawCard));
    setHeld(Array(5).fill(false));
    setDealt(true);
    setMessage("Hold any cards, then draw.");
  };

  const draw = () => {
    const next = hand.map((card, index) => (held[index] ? card : drawCard()));
    const result = score(next);
    const payout = Math.floor(bet * result.multiplier);
    if (payout > 0) addCoins(payout);
    setHand(next);
    setHeld(Array(5).fill(false));
    setDealt(false);
    setMessage(`${result.name}. ${payout.toLocaleString()} fake coins returned.`);
  };

  return (
    <GameShell eyebrow="Video Poker" title="Neon Video Poker" description="Hold cards and draw for simple fake-coin poker payouts.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="bg-[#252e63]/90">
          <div className="grid grid-cols-5 gap-2">
            {hand.map((card, index) => (
              <button key={index} onClick={() => dealt && setHeld((items) => items.map((item, itemIndex) => itemIndex === index ? !item : item))} className={cn("aspect-[.72] rounded-lg border bg-slate-50 p-2 text-slate-950", held[index] ? "border-green-300 shadow-green" : "border-white/20")}>
                <p className="text-xl font-black sm:text-3xl">{card.rank}</p>
                <p className="mt-2 text-lg font-black sm:text-2xl">{card.suit}</p>
                {held[index] && <p className="mt-2 text-xs font-black text-green-700">HELD</p>}
              </button>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} disabled={dealt} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          {!dealt ? <Button onClick={deal} className="w-full"><Club size={18} /> Deal</Button> : <Button onClick={draw} variant="secondary" className="w-full">Draw</Button>}
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
