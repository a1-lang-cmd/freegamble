"use client";

import { useState } from "react";
import { Diamond } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

const gems = ["Cyan", "Purple", "Green", "Gold", "Rose"];
const colors: Record<string, string> = {
  Cyan: "bg-cyan-300 text-cyan-950",
  Purple: "bg-purple-300 text-purple-950",
  Green: "bg-green-300 text-green-950",
  Gold: "bg-amber-300 text-amber-950",
  Rose: "bg-rose-300 text-rose-950"
};

function draw() {
  return Array.from({ length: 5 }, () => gems[Math.floor(Math.random() * gems.length)]);
}

function score(items: string[]) {
  const best = Math.max(...gems.map((gem) => items.filter((item) => item === gem).length));
  return best >= 5 ? 25 : best === 4 ? 8 : best === 3 ? 2.5 : best === 2 ? 0.5 : 0;
}

export default function DiamondsPage() {
  const [bet, setBet] = useState(100);
  const [items, setItems] = useState<string[]>(draw());
  const [message, setMessage] = useState("Reveal five gems. Matching gems pay fake-coin multipliers.");

  const play = () => {
    const check = validateBet(bet);
    if (!check.ok) return setMessage(check.message);
    removeCoins(check.bet);
    const next = draw();
    const multiplier = score(next);
    const payout = Math.floor(check.bet * multiplier);
    if (payout > 0) addCoins(payout);
    setItems(next);
    setMessage(`${multiplier}x result. ${payout.toLocaleString()} fake coins returned.`);
  };

  return (
    <GameShell eyebrow="Diamonds" title="Neon Diamonds" description="Reveal gem colors and win when they match. Fake coins only.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[340px] place-items-center bg-[#252e63]/90">
          <div className="grid w-full max-w-xl grid-cols-5 gap-2 sm:gap-4">
            {items.map((item, index) => (
              <div key={`${item}-${index}`} className={`grid aspect-square place-items-center rounded-xl border border-white/20 ${colors[item]} shadow-purple`}>
                <Diamond size={34} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
          <Button onClick={play} className="w-full">Reveal Gems</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
