"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Sparkles } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCoins } from "@/hooks/useCoins";

type Reward = {
  tier: "Common" | "Rare" | "Legendary";
  value: number;
  color: string;
};

const caseCost = 120;

function rollReward(): Reward {
  const roll = Math.random();
  if (roll < 0.6) {
    return { tier: "Common", value: 60 + Math.floor(Math.random() * 120), color: "text-cyan-100" };
  }
  if (roll < 0.9) {
    return { tier: "Rare", value: 200 + Math.floor(Math.random() * 280), color: "text-purple-100" };
  }
  return { tier: "Legendary", value: 700 + Math.floor(Math.random() * 900), color: "text-green-100" };
}

export default function CasesPage() {
  const { addCoins, removeCoins } = useCoins();
  const [reward, setReward] = useState<Reward | null>(null);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState("Open a case for a weighted fake-coin reward.");

  const openCase = () => {
    if (!removeCoins(caseCost)) {
      setMessage("Not enough fake coins to open this case.");
      return;
    }

    setOpening(true);
    setReward(null);
    setMessage("Case spinning...");

    window.setTimeout(() => {
      const nextReward = rollReward();
      setReward(nextReward);
      addCoins(nextReward.value);
      setOpening(false);
      setMessage(`${nextReward.tier} reward: +${nextReward.value.toLocaleString()} fake coins.`);
    }, 1100);
  };

  return (
    <GameShell
      eyebrow="Cases"
      title="Open Neon Cases"
      description="Cases cost fake coins and reveal weighted virtual rewards: Common 60%, Rare 30%, Legendary 10%."
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="grid min-h-[340px] place-items-center overflow-hidden sm:min-h-[420px]">
          <motion.div
            animate={opening ? { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
            transition={{ duration: 0.35, repeat: opening ? Infinity : 0 }}
            className="text-center"
          >
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-lg border border-purple-300/50 bg-purple-500/15 text-purple-100 shadow-purple sm:h-36 sm:w-36">
              {reward ? <Sparkles size={72} /> : <Box size={72} />}
            </div>
            <motion.div key={reward?.tier ?? "empty"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className={`mt-8 text-3xl font-black sm:text-5xl ${reward?.color ?? "text-slate-200"}`}>
                {opening ? "Rolling..." : reward ? reward.tier : "Mystery Case"}
              </p>
              <p className="mt-3 text-lg font-bold text-slate-300">
                {reward ? `+${reward.value.toLocaleString()} fake coins` : `${caseCost} fake coins to open`}
              </p>
            </motion.div>
          </motion.div>
        </Card>

        <Card className="space-y-4">
          <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-4">
            <p className="text-sm font-black text-cyan-100">Reward Odds</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between"><span>Common</span><span>60%</span></div>
              <div className="flex justify-between"><span>Rare</span><span>30%</span></div>
              <div className="flex justify-between"><span>Legendary</span><span>10%</span></div>
            </div>
          </div>
          <Button onClick={openCase} disabled={opening} className="w-full">
            Open Case
          </Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
