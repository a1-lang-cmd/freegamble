"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Rocket, Wifi, Zap } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCoins } from "@/hooks/useCoins";
import { validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type RoundPhase = "waiting" | "running" | "crashed";
type BetStatus = "none" | "queued" | "active" | "cashed" | "lost";

type Player = {
  name: string;
  multiplier: number;
  payout: number;
  bet: number;
};

const fakeNames = ["FxllinqKid", "qgtmvicc", "Kunotori", "szep2", "kksooskminha", "NeonNova", "MintRush", "CyanStack", "LuckyLoop", "DemoDealer", "VelvetVolt", "PixelPulse"];
const recentSeed = [1.79, 1.03, 2.34, 1.21, 1.93, 7.21, 3.48];
const joinWindowMs = 7000;
const maxRoundDurationMs = 30000;

const multiplierAt = (elapsedMs: number, durationMs: number, targetMultiplier: number) => {
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  const easedProgress = Math.pow(progress, targetMultiplier >= 100 ? 1.08 : 1.18);
  const value = Math.exp(Math.log(targetMultiplier) * easedProgress);
  return Number(Math.min(targetMultiplier, Math.max(1, value)).toFixed(value >= 100 ? 0 : 2));
};

function durationForMultiplier(targetMultiplier: number) {
  if (targetMultiplier < 2.5) {
    return 3500 + Math.random() * 3500;
  }

  if (targetMultiplier < 10) {
    return 7000 + Math.random() * 5500;
  }

  if (targetMultiplier < 100) {
    return 12500 + Math.random() * 8500;
  }

  if (targetMultiplier < 1000) {
    return 21000 + Math.random() * 5500;
  }

  return 26500 + Math.random() * 3500;
}

function rollCrashMultiplier(players: Player[]) {
  const totalBet = players.reduce((sum, player) => sum + player.bet, 0);
  const pressure = Math.min(0.18, players.length / 600 + totalBet / 900000);
  const roll = Math.random();
  let multiplier: number;

  if (roll < 0.5 + pressure) {
    multiplier = 1.01 + Math.random() * 1.49;
  } else if (roll < 0.76 + pressure * 0.55) {
    multiplier = 2.5 + Math.random() * 7.5;
  } else if (roll < 0.9 + pressure * 0.2) {
    multiplier = 10 + Math.random() ** 1.8 * 90;
  } else if (roll < 0.935) {
    multiplier = 100 + Math.random() ** 2.2 * 900;
  } else if (roll < 0.95) {
    multiplier = 1000 + Math.random() ** 2.7 * 4000;
  } else {
    multiplier = 5000 + Math.random() ** 3.2 * 5000;
  }

  return Math.min(10000, Number(multiplier.toFixed(multiplier >= 100 ? 0 : 2)));
}

function cubicPoint(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt ** 3 * p0 + 3 * mt ** 2 * t * p1 + 3 * mt * t ** 2 * p2 + t ** 3 * p3;
}

function cubicDerivative(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return 3 * mt ** 2 * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t ** 2 * (p3 - p2);
}

function approximateCubicLength(x: number[], y: number[]) {
  let length = 0;
  let previous = { x: x[0], y: y[0] };

  for (let step = 1; step <= 40; step += 1) {
    const t = step / 40;
    const next = {
      x: cubicPoint(t, x[0], x[1], x[2], x[3]),
      y: cubicPoint(t, y[0], y[1], y[2], y[3])
    };
    length += Math.hypot(next.x - previous.x, next.y - previous.y);
    previous = next;
  }

  return length;
}

function rocketPathPoint(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  const firstSegment = { x: [0, 190, 330, 455], y: [270, 270, 230, 135] };
  const secondSegment = { x: [455, 535, 585, 650], y: [135, 75, 45, 36] };
  const firstLength = approximateCubicLength(firstSegment.x, firstSegment.y);
  const secondLength = approximateCubicLength(secondSegment.x, secondSegment.y);
  const targetLength = clamped * (firstLength + secondLength);
  const first = targetLength <= firstLength;
  const t = first ? targetLength / firstLength : (targetLength - firstLength) / secondLength;
  const segment = first ? firstSegment : secondSegment;
  const x = cubicPoint(t, segment.x[0], segment.x[1], segment.x[2], segment.x[3]);
  const y = cubicPoint(t, segment.y[0], segment.y[1], segment.y[2], segment.y[3]);
  const dx = cubicDerivative(t, segment.x[0], segment.x[1], segment.x[2], segment.x[3]);
  const dy = cubicDerivative(t, segment.y[0], segment.y[1], segment.y[2], segment.y[3]);

  return {
    xPercent: (x / 760) * 100,
    yPercent: (y / 320) * 100,
    angle: Math.atan2(dy, dx) * (180 / Math.PI)
  };
}

function randomPlayerTarget() {
  return 24 + Math.floor(Math.random() * 58);
}

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }).map((_, index) => {
    const name = fakeNames[index % fakeNames.length];
    const multiplier = Number((1.05 + Math.random() * 4.8).toFixed(2));
    const bet = [100, 250, 300, 500, 700, 1200, 1700, 2000, 3000, 5000][Math.floor(Math.random() * 10)];
    return {
      name: index < fakeNames.length ? name : `${name}${index + 1}`,
      multiplier,
      bet,
      payout: Math.floor(bet * multiplier)
    };
  });
}

export default function CrashPage() {
  const { addCoins, removeCoins } = useCoins();
  const [betInput, setBetInput] = useState("100");
  const [activeBet, setActiveBet] = useState(0);
  const [betStatus, setBetStatus] = useState<BetStatus>("none");
  const [phase, setPhase] = useState<RoundPhase>("waiting");
  const [countdown, setCountdown] = useState(6);
  const [multiplier, setMultiplier] = useState(1);
  const [crashPoint, setCrashPoint] = useState(0);
  const [recent, setRecent] = useState(recentSeed);
  const [players, setPlayers] = useState<Player[]>([]);
  const [visiblePlayerCount, setVisiblePlayerCount] = useState(0);
  const [message, setMessage] = useState("Join the next free fake-coin crash round.");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundStartRef = useRef(0);
  const roundDurationRef = useRef(7000);
  const waitStartRef = useRef(0);
  const targetPlayersRef = useRef<Player[]>([]);
  const activeBetRef = useRef(0);
  const betStatusRef = useRef<BetStatus>("none");

  useEffect(() => {
    activeBetRef.current = activeBet;
  }, [activeBet]);

  useEffect(() => {
    betStatusRef.current = betStatus;
  }, [betStatus]);

  useEffect(() => {
    startWaiting();
    return () => {
      clearTimers();
    };
    // The crash loop is intentionally booted once; timer callbacks use refs for live round state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const startWaiting = () => {
    clearTimers();
    setPhase("waiting");
    setCountdown(Math.ceil(joinWindowMs / 1000));
    setMultiplier(1);
    setCrashPoint(0);
    const nextPlayers = makePlayers(randomPlayerTarget());
    targetPlayersRef.current = nextPlayers;
    setPlayers(nextPlayers);
    setVisiblePlayerCount(0);
    waitStartRef.current = Date.now();
    if (betStatusRef.current !== "queued") {
      setBetStatus("none");
      setActiveBet(0);
      activeBetRef.current = 0;
      betStatusRef.current = "none";
      setMessage("Join the next free fake-coin crash round.");
    } else {
      setMessage("Bet locked. Launching next round soon.");
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - waitStartRef.current;
      const progress = Math.min(1, elapsed / joinWindowMs);
      const easedProgress = 1 - Math.pow(1 - progress, 1.8);
      const nextVisibleCount = Math.min(targetPlayersRef.current.length, Math.floor(easedProgress * targetPlayersRef.current.length));
      setVisiblePlayerCount(nextVisibleCount);
      setCountdown(Math.max(0, Math.ceil((joinWindowMs - elapsed) / 1000)));
      if (progress >= 1) {
        launchRound();
      }
    }, 250);
  };

  const launchRound = () => {
    clearTimers();
    const point = rollCrashMultiplier(targetPlayersRef.current);
    const duration = Math.min(maxRoundDurationMs, durationForMultiplier(point));
    roundDurationRef.current = duration;
    roundStartRef.current = Date.now();
    setCrashPoint(point);
    setPhase("running");
    setMultiplier(1);
    setVisiblePlayerCount(targetPlayersRef.current.length);

    if (betStatusRef.current === "queued") {
      setBetStatus("active");
      betStatusRef.current = "active";
      setMessage("Round is live. Cash out before the rocket crashes.");
    } else {
      setMessage("Round is live. Join opens after this crash.");
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartRef.current;
      setMultiplier(multiplierAt(Math.min(elapsed, roundDurationRef.current), roundDurationRef.current, point));
    }, 80);

    timeoutRef.current = setTimeout(() => {
      crashRound(point);
    }, duration);
  };

  const crashRound = (point: number) => {
    clearTimers();
    setPhase("crashed");
    setMultiplier(point);
    setCrashPoint(point);
    setRecent((items) => [point, ...items].slice(0, 7));

    if (betStatusRef.current === "active") {
      setBetStatus("lost");
      betStatusRef.current = "lost";
      setMessage(`Crashed at ${point.toFixed(2)}x. Fake bet lost.`);
    } else if (betStatusRef.current === "cashed") {
      setMessage(`Round crashed at ${point.toFixed(2)}x. Your fake payout was already secured.`);
    } else {
      setMessage(`Crashed at ${point.toFixed(2)}x. Next round opens now.`);
    }

    timeoutRef.current = setTimeout(startWaiting, 2800);
  };

  const joinRound = () => {
    if (phase !== "waiting") {
      setMessage("Wait for the next join window.");
      return;
    }
    if (betStatus === "queued") {
      setMessage("You are already joined for the next round.");
      return;
    }

    const check = validateBet(Number(betInput));
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    if (!removeCoins(check.bet)) {
      setMessage("Not enough fake coins for that bet.");
      return;
    }

    setBetInput(String(check.bet));
    setActiveBet(check.bet);
    activeBetRef.current = check.bet;
    setBetStatus("queued");
    betStatusRef.current = "queued";
    setMessage(`Joined next round with ${check.bet.toLocaleString()} fake coins.`);
  };

  const cashOut = () => {
    if (phase !== "running" || betStatus !== "active") {
      return;
    }

    const payout = Math.floor(activeBetRef.current * multiplier);
    addCoins(payout);
    setBetStatus("cashed");
    betStatusRef.current = "cashed";
    setMessage(`Cashed out at ${multiplier.toFixed(2)}x for ${payout.toLocaleString()} fake coins.`);
  };

  const payoutPreview = useMemo(() => Math.floor(activeBet * multiplier), [activeBet, multiplier]);
  const visiblePlayers = players.slice(0, visiblePlayerCount);
  const totalRoundBet = visiblePlayers.reduce((sum, player) => sum + player.bet, 0) + (betStatus !== "none" ? activeBet : 0);
  const flightProgress =
    phase === "waiting"
      ? 0
      : crashPoint > 1
        ? Math.min(1, Math.max(0.04, (multiplier - 1) / (crashPoint - 1)))
        : 0.04;
  const trailLength = phase === "waiting" ? 0.06 : Math.max(0.08, flightProgress);
  const trailOpacity = phase === "waiting" ? 0.2 : 1;
  const rocketPoint = rocketPathPoint(flightProgress);
  const liveAxisTop = phase === "waiting" ? 1.6 : multiplier + Math.max(0.35, multiplier * 0.12);
  const axisMin = Math.max(1, liveAxisTop > 3 ? liveAxisTop - 1.4 : 1);
  const axisMax = Math.max(1.6, Math.ceil(liveAxisTop * 10) / 10);
  const axisLabels = Array.from({ length: 7 }, (_, index) => {
    const value = axisMin + ((axisMax - axisMin) / 6) * (6 - index);
    return Number(value.toFixed(1));
  });

  return (
    <GameShell
      eyebrow="Crash"
      title="Rocket Crash Rounds"
      description="Join the next round, watch the multiplier climb for a random amount of time, and cash out before the crash. Fake coins only."
    >
      <div className="grid gap-6 xl:grid-cols-[445px_1fr]">
        <div className="space-y-6">
          <Card className="space-y-5 bg-[#20284e]/80">
            <div className="flex gap-2">
              <button className="rounded-lg bg-blue-500/15 px-5 py-3 text-sm font-black text-white">Manual</button>
              <button className="rounded-lg px-5 py-3 text-sm font-bold text-slate-400">Auto</button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400" htmlFor="crash-bet">
                Bet amount
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-slate-900/45 p-2">
                <input
                  id="crash-bet"
                  type="text"
                  inputMode="numeric"
                  value={betInput}
                  disabled={phase !== "waiting" || betStatus === "queued"}
                  onChange={(event) => setBetInput(event.target.value.replace(/[^\d]/g, ""))}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-black text-white outline-none"
                />
                <button
                  onClick={() => setBetInput(String(Math.max(1, Math.floor(Number(betInput || 0) / 2))))}
                  disabled={phase !== "waiting" || betStatus === "queued"}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40"
                >
                  1/2
                </button>
                <button
                  onClick={() => setBetInput(String(Math.max(1, Math.floor(Number(betInput || 1) * 2))))}
                  disabled={phase !== "waiting" || betStatus === "queued"}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40"
                >
                  2x
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-400">Auto cashout multiplier</p>
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-900/35 p-2 opacity-60">
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-slate-300">Disable</button>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-slate-300">2.00x</button>
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-slate-300">10.00x</button>
              </div>
            </div>

            {betStatus === "active" ? (
              <Button onClick={cashOut} variant="secondary" className="w-full bg-green-400/20">
                Cash out {payoutPreview.toLocaleString()}
              </Button>
            ) : (
              <Button onClick={joinRound} disabled={phase !== "waiting" || betStatus === "queued"} className="w-full">
                {betStatus === "queued" ? `Joined: ${activeBet.toLocaleString()}` : "Join next game"}
              </Button>
            )}
            <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">{message}</p>
          </Card>

          <Card className="overflow-hidden bg-[#20284e]/80 p-0">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <p className="font-black text-white">{visiblePlayerCount} Players</p>
              <p className="font-black text-white">{totalRoundBet.toLocaleString()}</p>
            </div>
            <div className="divide-y divide-white/5">
              {visiblePlayers.slice(0, 6).map((player) => (
                <div key={player.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 text-sm">
                  <p className="font-bold text-white">{player.name}</p>
                  <p className="font-black text-white">{player.multiplier.toFixed(2)} <span className="text-slate-400">x</span></p>
                  <p className="font-black text-cyan-300">{player.payout.toLocaleString()}</p>
                </div>
              ))}
              {visiblePlayers.length === 0 && (
                <div className="px-5 py-8 text-sm font-bold text-slate-400">Waiting for players to join...</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="relative min-h-[610px] overflow-hidden bg-[#252e63]/90 p-0">
          <div className="absolute left-8 top-5 z-10 flex flex-wrap gap-2">
            {recent.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className={cn(
                  "rounded-lg px-4 py-1 text-sm font-black text-white",
                  item >= 5 ? "bg-blue-500" : item >= 2 ? "bg-amber-400 text-slate-950" : "bg-white/12"
                )}
              >
                {item.toFixed(2)}
              </span>
            ))}
          </div>

          <div className="absolute right-8 top-5 z-10 flex items-center gap-8 text-sm font-bold text-slate-300">
            <span className="flex items-center gap-2"><HelpCircle size={16} /> Fairness</span>
            <span className="flex items-center gap-2">Network status <Wifi className="text-cyan-300" size={16} /></span>
          </div>

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(168,85,247,.35),transparent_30%),radial-gradient(circle_at_32%_55%,rgba(59,130,246,.28),transparent_28%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/55 to-transparent" />

          <div className="absolute left-8 top-28 z-10 flex h-[430px] flex-col justify-between text-base font-black text-white/90">
            {axisLabels.map((label) => (
              <span key={label}>{label.toFixed(1)}x</span>
            ))}
          </div>

          <div className="absolute bottom-20 left-24 right-10 h-80">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 320" aria-hidden="true">
              <defs>
                <linearGradient id="rocketTrail" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="58%" stopColor={phase === "crashed" ? "rgba(251,113,133,.42)" : "rgba(255,255,255,.34)"} />
                  <stop offset="100%" stopColor={phase === "crashed" ? "rgba(251,113,133,.92)" : "rgba(255,255,255,.86)"} />
                </linearGradient>
              </defs>
              <motion.path
                d="M 0 270 C 190 270 330 230 455 135 C 535 75 585 45 650 36"
                fill="none"
                stroke="url(#rocketTrail)"
                strokeWidth="18"
                strokeLinecap="round"
                pathLength={1}
                animate={{ opacity: trailOpacity }}
                transition={{ duration: 0.16 }}
                style={{
                  filter: "blur(10px)",
                  strokeDasharray: `${trailLength} 1`
                }}
              />
              <motion.path
                d="M 0 270 C 190 270 330 230 455 135 C 535 75 585 45 650 36"
                fill="none"
                stroke="url(#rocketTrail)"
                strokeWidth="8"
                strokeLinecap="round"
                pathLength={1}
                animate={{ opacity: trailOpacity }}
                transition={{ duration: 0.18 }}
                style={{ strokeDasharray: `${trailLength} 1` }}
              />
            </svg>

            <motion.div
              animate={{
                left: `${rocketPoint.xPercent}%`,
                top: `${rocketPoint.yPercent}%`,
                rotate: phase === "crashed" ? rocketPoint.angle + 28 : rocketPoint.angle - 12,
                scale: phase === "running" ? [1, 1.04, 1] : 1
              }}
              transition={{ duration: 0.2, scale: { repeat: phase === "running" ? Infinity : 0, duration: 0.8 } }}
              className="absolute z-20 grid h-28 w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-orange-400/15 text-orange-200 shadow-purple"
            >
              {phase === "crashed" ? <Zap size={64} /> : <Rocket size={72} />}
            </motion.div>
          </div>

          <div className="relative z-10 grid min-h-[610px] place-items-center text-center">
            <div>
              <p className={cn("text-7xl font-black sm:text-8xl", phase === "crashed" ? "text-rose-200" : "text-white")}>
                {phase === "waiting" ? `${countdown}s` : `${multiplier.toFixed(2)}x`}
              </p>
              <p className="mt-5 text-2xl font-bold text-white">
                {phase === "waiting" ? "Next game starts" : phase === "crashed" ? `Crashed at ${crashPoint.toFixed(2)}x` : "Current payout"}
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 left-24 right-10 z-10 flex justify-between text-base font-black text-white/90">
            {["12s", "15s", "18s", "21s", "24s", "27s", "30s"].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </Card>
      </div>
    </GameShell>
  );
}
