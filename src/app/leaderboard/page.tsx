import { Trophy } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Card } from "@/components/ui/Card";

const players = [
  { name: "NeonNova", coins: 98420 },
  { name: "CyanStack", coins: 83610 },
  { name: "VelvetVolt", coins: 77240 },
  { name: "LuckyLoop", coins: 68150 },
  { name: "MintRush", coins: 58880 },
  { name: "PixelPulse", coins: 48290 },
  { name: "ZeroCashout", coins: 39110 },
  { name: "DemoDealer", coins: 28100 }
].sort((a, b) => b.coins - a.coins);

export default function LeaderboardPage() {
  return (
    <GameShell
      eyebrow="Leaderboard"
      title="Top Fake Balances"
      description="A styled demo board for social competition. These are fictional profiles and virtual coin totals."
    >
      <Card>
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.name}
              className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-purple-300/40 bg-purple-500/10 text-lg font-black text-purple-100">
                {index + 1}
              </div>
              <div>
                <p className="font-black text-white">{player.name}</p>
                <p className="text-sm text-slate-400">Free social casino profile</p>
              </div>
              <div className="flex items-center gap-2 text-right text-lg font-black text-green-100">
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
