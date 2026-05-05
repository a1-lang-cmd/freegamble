import Link from "next/link";
import { Bomb, CircleDot, Coins, Gem, Hand, Orbit, RadioTower, Rows3, Sparkles, Trophy, Waves } from "lucide-react";
import { DailyReward } from "@/components/DailyReward";
import { FakeValueNotice } from "@/components/FakeValueNotice";
import { Card } from "@/components/ui/Card";

const games = [
  {
    href: "/crash",
    title: "Crash",
    description: "Ride a rising multiplier and cash out before the round crashes.",
    icon: RadioTower,
    color: "text-cyan-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/mines",
    title: "Mines",
    description: "Reveal safe tiles, dodge hidden bombs, and bank your multiplier.",
    icon: Bomb,
    color: "text-purple-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/cases",
    title: "Cases",
    description: "Open glowing cases for weighted fake-coin rewards.",
    icon: Gem,
    color: "text-green-200",
    glow: "hover:shadow-green"
  },
  {
    href: "/roulette",
    title: "Roulette",
    description: "Pick red, black, or green and spin a neon table wheel.",
    icon: CircleDot,
    color: "text-rose-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/plinko",
    title: "Plinko",
    description: "Drop a glowing ball through pins into random multiplier slots.",
    icon: Waves,
    color: "text-cyan-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/slots",
    title: "Slots",
    description: "Spin neon reels with paylines, weighted symbols, and fake-coin payouts.",
    icon: Sparkles,
    color: "text-fuchsia-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/blackjack",
    title: "Blackjack",
    description: "Play a table hand with hit, stand, double, and 3:2 blackjack payouts.",
    icon: Hand,
    color: "text-blue-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/towers",
    title: "Towers",
    description: "Climb row by row, picking safe tiles as multipliers rise.",
    icon: Rows3,
    color: "text-emerald-200",
    glow: "hover:shadow-green"
  },
  {
    href: "/coinflip",
    title: "Coinflip",
    description: "Call heads or tails and watch the neon coin settle.",
    icon: Coins,
    color: "text-amber-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/wheel",
    title: "Prize Wheel",
    description: "Spin a huge multiplier wheel with free fake-coin stakes.",
    icon: Orbit,
    color: "text-fuchsia-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description: "See the top fake balances across the FreeGamble floor.",
    icon: Trophy,
    color: "text-amber-200",
    glow: "hover:shadow-purple"
  }
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 py-6 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Fake coins. Real polish.</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
            Neon casino games built for free social play.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Play Crash, Mines, and Cases with a persistent fake balance. Every coin is virtual, free, and locked inside this browser.
          </p>
        </div>
        <FakeValueNotice />
      </section>

      <DailyReward />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link key={game.href} href={game.href} className="group">
              <Card className={`h-full transition duration-300 hover:-translate-y-1 ${game.glow}`}>
                <div className={`mb-8 grid h-14 w-14 place-items-center rounded-lg border border-white/10 bg-white/5 ${game.color}`}>
                  <Icon size={30} />
                </div>
                <h2 className="text-2xl font-black text-white transition group-hover:text-cyan-100">{game.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{game.description}</p>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
