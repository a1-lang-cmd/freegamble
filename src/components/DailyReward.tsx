"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { canClaimDaily, claimDailyReward, DAILY_CLAIM_KEY, getDailyRewardAmount } from "@/lib/coins";

export function DailyReward() {
  const [claimable, setClaimable] = useState(false);
  const [amount, setAmount] = useState(350);
  const [message, setMessage] = useState("Claim your free daily coin drop.");

  useEffect(() => {
    setClaimable(canClaimDaily());
    setAmount(getDailyRewardAmount());
  }, []);

  const claim = () => {
    if (claimDailyReward()) {
      setClaimable(false);
      setMessage(`+${amount.toLocaleString()} fake coins added. Come back tomorrow.`);
      return;
    }

    const lastClaim = Number(window.localStorage.getItem(DAILY_CLAIM_KEY) ?? 0);
    const nextClaim = new Date(lastClaim + 24 * 60 * 60 * 1000);
    setMessage(`Next claim unlocks ${nextClaim.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel flex flex-col gap-4 rounded-lg p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-green-300/40 bg-green-400/10 text-green-200 shadow-green">
          <Gift />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Daily Free Coins</h2>
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      </div>
      <Button onClick={claim} disabled={!claimable} variant="secondary">
        Claim {amount.toLocaleString()}
      </Button>
    </motion.section>
  );
}
