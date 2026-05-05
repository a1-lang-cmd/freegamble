"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Card } from "@/components/ui/Card";
import { fetchLeaderboard, isDatabaseConfigured, type LeaderboardEntry } from "@/lib/supabase";

const fallbackPlayers: LeaderboardEntry[] = [
  { username: "NeonNova", coins: 98420 },
  { username: "CyanStack", coins: 83610 },
  { username: "VelvetVolt", coins: 77240 },
  { username: "LuckyLoop", coins: 68150 },
  { username: "MintRush", coins: 58880 },
  { username: "PixelPulse", coins: 48290 },
  { username: "ZeroCashout", coins: 39110 },
  { username: "DemoDealer", coins: 28100 }
].sort((a, b) => b.coins - a.coins);

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>(fallbackPlayers);
  const [loadedRemote, setLoadedRemote] = useState(false);

  useEffect(() => {
    fetchLeaderboard().then((entries) => {
      if (entries?.length) {
        setPlayers(entries);
        setLoadedRemote(true);
      }
    });
  }, []);

  return (
    <GameShell
      eyebrow="Leaderboard"
      title="Top Fake Balances"
      description="Public social leaderboard for logged-in FreeGamble profiles. Coins are virtual and have no real-world value."
    >
      <Card>
        {!isDatabaseConfigured() && (
          <div className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
            Database is not configured yet, so this page is showing demo players.
          </div>
        )}
        {isDatabaseConfigured() && !loadedRemote && (
          <div className="mb-4 rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm font-bold text-cyan-100">
            Waiting for public profiles. Demo players are shown until real leaderboard data exists.
          </div>
        )}
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={`${player.username}-${index}`}
              className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 sm:grid-cols-[48px_1fr_auto] sm:gap-4 sm:p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-purple-300/40 bg-purple-500/10 text-base font-black text-purple-100 sm:h-11 sm:w-11 sm:text-lg">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate font-black text-white">{player.username}</p>
                <p className="text-sm text-slate-400">Free social casino profile</p>
              </div>
              <div className="flex items-center gap-2 text-right text-sm font-black text-green-100 sm:text-lg">
                <Trophy size={18} />
                {player.coins.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </GameShell>
  );
}
