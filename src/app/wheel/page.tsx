"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Orbit } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";

const segments = [0.2, 0.5, 1, 2, 0.5, 5, 1, 10];
const segmentColors = ["#22d3ee", "#a855f7", "#22c55e", "#ef4444", "#38bdf8", "#f59e0b", "#14b8a6", "#f472b6"];
const segmentAngle = 360 / segments.length;

export default function WheelPage() {
  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [message, setMessage] = useState("Spin the prize wheel for a random fake-coin multiplier.");

  const spin = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    removeCoins(check.bet);
    setSpinning(true);
    setResult(null);
    const index = Math.floor(Math.random() * segments.length);
    const segmentCenterAngle = index * segmentAngle + segmentAngle / 2;
    const extraSpins = 1440;
    setRotation((current) => current + extraSpins - segmentCenterAngle);

    window.setTimeout(() => {
      const multiplier = segments[index];
      const payout = Math.floor(check.bet * multiplier);
      addCoins(payout);
      setResult(multiplier);
      setSpinning(false);
      setMessage(`Wheel landed on ${multiplier}x. ${payout.toLocaleString()} fake coins returned.`);
    }, 1450);
  };

  return (
    <GameShell eyebrow="Prize Wheel" title="Spin the Multiplier Wheel" description="A big animated wheel with virtual multiplier segments. Every outcome uses fake coins only.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="relative grid min-h-[390px] place-items-center overflow-hidden sm:min-h-[460px]">
          <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2">
            <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[32px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_0_14px_rgba(34,211,238,.85)]" />
            <div className="mx-auto -mt-1 h-5 w-2 rounded-full bg-cyan-200 shadow-neon" />
          </div>
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="relative grid h-[min(20rem,calc(100vw-4rem))] w-[min(20rem,calc(100vw-4rem))] place-items-center rounded-full border-4 border-fuchsia-200/50 shadow-purple"
            style={{
              background: `conic-gradient(${segmentColors
                .map((color, index) => `${color} ${(index / segments.length) * 100}% ${((index + 1) / segments.length) * 100}%`)
                .join(", ")})`
            }}
          >
            {segments.map((multiplier, index) => {
              const angle = index * segmentAngle + segmentAngle / 2;
              return (
                <span
                  key={`${multiplier}-${index}`}
                  className="absolute left-1/2 top-1/2 rounded-md border border-white/25 bg-slate-950/75 px-2 py-1 text-sm font-black text-white shadow-lg"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-118px) rotate(90deg)`
                  }}
                >
                  {multiplier}x
                </span>
              );
            })}
            <div className="z-10 grid h-[40%] w-[40%] place-items-center rounded-full border border-white/20 bg-slate-950 text-fuchsia-100">
              <Orbit size={58} />
            </div>
          </motion.div>
          <p className="mt-5 text-2xl font-black text-white">{result ? `${result}x` : "Ready"}</p>
        </Card>
        <Card className="space-y-4">
          <input type="number" min={1} value={bet} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-fuchsia-300" />
          <Button onClick={spin} disabled={spinning} variant="secondary" className="w-full">Spin Wheel</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
