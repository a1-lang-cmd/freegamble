import Link from "next/link";
import { ArrowUpDown, Bomb, CircleDot, Club, Coins, Dices, Eraser, Gem, Goal, Grid3X3, Hand, Landmark, Orbit, RadioTower, Rows3, Sparkles, TrendingUp, Trophy, Waves } from "lucide-react";
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
    href: "/dice",
    title: "Dice",
    description: "Pick a roll-under target and chase a clean fake-coin multiplier.",
    icon: Dices,
    color: "text-cyan-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/limbo",
    title: "Limbo",
    description: "Choose a target multiplier and hope the roll clears it.",
    icon: TrendingUp,
    color: "text-green-200",
    glow: "hover:shadow-green"
  },
  {
    href: "/keno",
    title: "Keno",
    description: "Pick numbers and draw for fake-coin hit payouts.",
    icon: Grid3X3,
    color: "text-blue-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/hilo",
    title: "Hi-Lo",
    description: "Guess higher or lower and build a streak multiplier.",
    icon: ArrowUpDown,
    color: "text-amber-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/scratch",
    title: "Scratchers",
    description: "Reveal a neon scratch card and chase the best hidden multiplier.",
    icon: Eraser,
    color: "text-cyan-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/baccarat",
    title: "Baccarat",
    description: "Pick Player, Banker, or Tie in a quick fake-coin table deal.",
    icon: Landmark,
    color: "text-purple-200",
    glow: "hover:shadow-purple"
  },
  {
    href: "/videopoker",
    title: "Video Poker",
    description: "Hold cards and draw for simple fake-coin poker payouts.",
    icon: Club,
    color: "text-blue-200",
    glow: "hover:shadow-neon"
  },
  {
    href: "/goalrush",
    title: "Goal Rush",
    description: "Pick a penalty lane and beat the keeper for a fast 2x.",
    icon: Goal,
    color: "text-green-200",
    glow: "hover:shadow-green"
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
    <div className="min-w-0 space-y-8">
      <section className="grid min-w-0 gap-6 py-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)] lg:items-end">
        <div className="min-w-0">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Fake coins. Real polish.</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight text-white sm:text-6xl">
            Neon casino games built for free social play.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Play Crash, Mines, and Cases with a persistent fake balance. Every coin is virtual, free, and locked inside this browser.
          </p>
        </div>
        <FakeValueNotice />
      </section>

      <DailyReward />

      <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Link key={game.href} href={game.href} className="group">
              <Card className={`h-full transition duration-300 hover:-translate-y-1 ${game.glow}`}>
                <div className={`mb-8 grid h-14 w-14 place-items-center rounded-lg border border-white/10 bg-white/5 ${game.color}`}>
                  <Icon size={30} />
                </div>
                <h2 className="break-words text-xl font-black text-white transition group-hover:text-cyan-100 sm:text-2xl">{game.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{game.description}</p>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
