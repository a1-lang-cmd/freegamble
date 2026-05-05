"use client";

import Link from "next/link";
import { Coins, Shield, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCoins } from "@/hooks/useCoins";

const links = [
  { href: "/", label: "Home" },
  { href: "/crash", label: "Crash" },
  { href: "/mines", label: "Mines" },
  { href: "/cases", label: "Cases" },
  { href: "/roulette", label: "Roulette" },
  { href: "/plinko", label: "Plinko" },
  { href: "/slots", label: "Slots" },
  { href: "/blackjack", label: "Blackjack" },
  { href: "/towers", label: "Towers" },
  { href: "/coinflip", label: "Coinflip" },
  { href: "/wheel", label: "Wheel" },
  { href: "/leaderboard", label: "Leaderboard" }
];

export function Navbar() {
  const { balance } = useCoins();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black tracking-wide text-white">
          <span className="text-glow-cyan text-cyan-300">Free</span>
          <span className="text-glow-purple text-purple-300">Gamble</span>
        </Link>

        <div className="order-3 flex w-full gap-2 overflow-x-auto md:order-none md:w-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="hidden h-10 w-10 place-items-center rounded-lg border border-rose-300/20 bg-rose-500/5 text-rose-200/70 transition hover:border-rose-300/50 hover:bg-rose-500/15 hover:text-rose-100 sm:grid"
            aria-label="Admin"
          >
            <Shield size={18} />
          </Link>
          <motion.div
            animate={{ boxShadow: "0 0 22px rgba(34, 197, 94, 0.24)" }}
            className="flex items-center gap-2 rounded-lg border border-green-300/40 bg-green-400/10 px-3 py-2 text-sm font-black text-green-200"
          >
            <Coins size={18} />
            {balance.toLocaleString()}
          </motion.div>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg border border-purple-300/40 bg-purple-500/10 text-purple-100 transition hover:bg-purple-500/20"
            aria-label="Profile"
          >
            <UserCircle size={22} />
          </button>
        </div>
      </nav>
    </header>
  );
}
