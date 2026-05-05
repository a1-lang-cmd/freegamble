"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Matter from "matter-js";
import { HelpCircle } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type Difficulty = "Easy" | "Normal" | "Hard";

const boardWidth = 760;
const boardHeight = 560;
const boardLeft = 76;
const boardRight = boardWidth - boardLeft;
const boardInnerWidth = boardRight - boardLeft;
const rowOptions = [8, 10, 12, 14, 16];
const difficultyOptions: Difficulty[] = ["Easy", "Normal", "Hard"];

const multiplierTables: Record<Difficulty, number[]> = {
  Easy: [5.7, 2.3, 1.2, 1, 1, 0.5, 1, 1, 1.2, 2.3, 5.7],
  Normal: [10, 4, 1.8, 1.2, 0.6, 0.3, 0.6, 1.2, 1.8, 4, 10],
  Hard: [25, 8, 3, 1.4, 0.4, 0.2, 0.4, 1.4, 3, 8, 25]
};

type PhysicsRefs = {
  engine: Matter.Engine;
  runner: Matter.Runner;
  render: Matter.Render;
  balls: Map<number, Matter.Body>;
  activeBet: number;
  remaining: number;
  totalPayout: number;
  nextBallId: number;
};

function fitMultipliers(source: number[], slots: number) {
  if (slots === source.length) {
    return source;
  }

  return Array.from({ length: slots }, (_, index) => {
    const sourceIndex = Math.round((index / Math.max(1, slots - 1)) * (source.length - 1));
    return source[sourceIndex];
  });
}

export default function PlinkoPage() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const physicsRef = useRef<PhysicsRefs | null>(null);
  const slotRef = useRef<number | null>(null);
  const [bet, setBet] = useState(25);
  const [ballCount, setBallCount] = useState(1);
  const [rows, setRows] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [dropping, setDropping] = useState(false);
  const [slot, setSlot] = useState<number | null>(null);
  const [message, setMessage] = useState("Choose settings, then start a Plinko drop.");

  const multipliers = useMemo(() => fitMultipliers(multiplierTables[difficulty], rows + 1), [difficulty, rows]);
  const pegSpacingX = boardInnerWidth / (rows + 1);
  const pegSpacingY = rows <= 8 ? 42 : rows <= 10 ? 38 : rows <= 12 ? 33 : rows <= 14 ? 29 : 26;
  const ballRadius = rows <= 8 ? 13 : rows <= 10 ? 12 : rows <= 12 ? 10.5 : rows <= 14 ? 9.25 : 8.25;
  const topY = 58;
  const slotTop = topY + (rows - 1) * pegSpacingY + 46;

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);

  useEffect(() => {
    if (!boardRef.current) {
      return;
    }

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.12, scale: 0.001 }
    });

    const render = Matter.Render.create({
      element: boardRef.current,
      engine,
      options: {
        width: boardWidth,
        height: boardHeight,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });

    const runner = Matter.Runner.create();
    const bodies: Matter.Body[] = [];
    const addRail = (x1: number, y1: number, x2: number, y2: number) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const length = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      bodies.push(
        Matter.Bodies.rectangle(midX, midY, length, 8, {
          isStatic: true,
          angle,
          restitution: 0.95,
          friction: 0,
          render: { fillStyle: "transparent" }
        })
      );
    };

    bodies.push(
      Matter.Bodies.rectangle(boardWidth / 2, boardHeight + 26, boardWidth, 52, {
        isStatic: true,
        render: { fillStyle: "transparent" }
      }),
      Matter.Bodies.rectangle(48, boardHeight / 2, 28, boardHeight, {
        isStatic: true,
        render: { fillStyle: "transparent" }
      }),
      Matter.Bodies.rectangle(boardWidth - 48, boardHeight / 2, 28, boardHeight, {
        isStatic: true,
        render: { fillStyle: "transparent" }
      })
    );

    const topEdgePegs = 3;
    const bottomEdgePegs = rows + 2;
    const topStartX = boardWidth / 2 - ((topEdgePegs - 1) * pegSpacingX) / 2;
    const bottomStartX = boardWidth / 2 - ((bottomEdgePegs - 1) * pegSpacingX) / 2;
    const bottomY = topY + (rows - 1) * pegSpacingY;
    const railOffset = ballRadius + 28;

    addRail(topStartX - railOffset, topY - 26, bottomStartX - railOffset, bottomY + 42);
    addRail(topStartX + (topEdgePegs - 1) * pegSpacingX + railOffset, topY - 26, bottomStartX + (bottomEdgePegs - 1) * pegSpacingX + railOffset, bottomY + 42);

    for (let row = 0; row < rows; row += 1) {
      const pegsInRow = row + 3;
      const startX = boardWidth / 2 - ((pegsInRow - 1) * pegSpacingX) / 2;
      const y = topY + row * pegSpacingY;

      for (let index = 0; index < pegsInRow; index += 1) {
        bodies.push(
          Matter.Bodies.circle(startX + index * pegSpacingX, y, 5.25, {
            isStatic: true,
            restitution: 1.02,
            friction: 0,
            render: {
              fillStyle: "rgba(203,213,225,.64)",
              strokeStyle: "rgba(226,232,240,.55)",
              lineWidth: 1
            }
          })
        );
      }
    }

    const slotWidth = boardInnerWidth / multipliers.length;
    for (let index = 0; index <= multipliers.length; index += 1) {
      const x = boardLeft + index * slotWidth;
      bodies.push(
        Matter.Bodies.rectangle(x, slotTop + 24, 4, 64, {
          isStatic: true,
          chamfer: { radius: 4 },
          restitution: 0.9,
          friction: 0,
          render: { fillStyle: "rgba(99,102,241,.18)" }
        })
      );
    }

    Matter.Composite.add(engine.world, bodies);

    const afterRender = () => {
      const context = render.context;
      const chipY = slotTop + 54;
      const chipHeight = 24;
      const chipWidth = Math.min(48, slotWidth - 5);

      multipliers.forEach((multiplier, index) => {
        const centerX = boardLeft + slotWidth * (index + 0.5);
        const x = centerX - chipWidth / 2;
        const y = chipY - chipHeight / 2;
        const selected = slotRef.current === index;
        const color =
          selected
            ? "#4ade80"
            : multiplier >= 5
              ? "#a855f7"
              : multiplier > 1
                ? "#d946ef"
                : multiplier === 1
                  ? "#f97316"
                  : "#f59e0b";

        context.save();
        context.fillStyle = color;
        context.strokeStyle = selected ? "#bbf7d0" : "rgba(255,255,255,.28)";
        context.lineWidth = selected ? 3 : 1;
        context.beginPath();
        context.roundRect(x, y, chipWidth, chipHeight, 6);
        context.fill();
        context.stroke();
        context.fillStyle = multiplier < 1 && !selected ? "#0f172a" : "#ffffff";
        context.font = `${rows >= 14 ? "900 10px" : "900 12px"} sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(`${multiplier}x`, centerX, chipY + 1);
        context.restore();
      });
    };

    Matter.Events.on(render, "afterRender", afterRender);
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    physicsRef.current = {
      engine,
      runner,
      render,
      balls: new Map(),
      activeBet: 0,
      remaining: 0,
      totalPayout: 0,
      nextBallId: 1
    };

    const afterUpdate = () => {
      const physics = physicsRef.current;
      if (!physics || physics.balls.size === 0) {
        return;
      }

      Array.from(physics.balls.entries()).forEach(([id, ball]) => {
        const bestY = ball.plugin.bestY ?? ball.position.y;
        const now = Date.now();
        if (ball.position.y > bestY + 2) {
          ball.plugin.bestY = ball.position.y;
          ball.plugin.stuckSince = null;
        }

        if (!ball.plugin.resolved && ball.position.y < slotTop) {
          ball.plugin.stuckSince = ball.plugin.stuckSince ?? now;
          const stuckMs = now - ball.plugin.stuckSince;
          if (stuckMs > 1400 && stuckMs < 5000 && stuckMs % 350 < 18) {
            Matter.Body.setVelocity(ball, {
              x: (Math.random() - 0.5) * 2.4,
              y: Math.max(0.9, ball.velocity.y + 0.55)
            });
          }
          if (stuckMs >= 5000) {
            Matter.Body.setPosition(ball, {
              x: boardWidth / 2 + (Math.random() - 0.5) * 28,
              y: 30
            });
            Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 2.1, y: 0.6 });
            Matter.Body.setAngularVelocity(ball, 0);
            ball.plugin.stuckSince = null;
            ball.plugin.bestY = ball.position.y;
            setMessage("A stuck ball was reset to the top instead of being paid early.");
            return;
          }
        }

        if (ball.position.y < slotTop || ball.plugin.resolved) {
          return;
        }

        ball.plugin.resolved = true;
        const nextSlot = Math.max(0, Math.min(multipliers.length - 1, Math.floor((ball.position.x - boardLeft) / slotWidth)));
        const multiplier = multipliers[nextSlot];
        const payout = Math.floor((ball.plugin.bet ?? physics.activeBet) * multiplier);
        physics.totalPayout += payout;
        physics.remaining -= 1;
        addCoins(payout);
        setSlot(nextSlot);

        if (physics.remaining <= 0) {
          setDropping(false);
          setMessage(`${physics.balls.size} ball${physics.balls.size === 1 ? "" : "s"} finished. ${physics.totalPayout.toLocaleString()} fake coins returned.`);
        } else {
          setMessage(`${physics.remaining} ball${physics.remaining === 1 ? "" : "s"} still dropping. ${physics.totalPayout.toLocaleString()} fake coins returned so far.`);
        }

        window.setTimeout(() => {
          Matter.Composite.remove(physics.engine.world, ball);
          physics.balls.delete(id);
        }, 800);
      });
    };

    Matter.Events.on(engine, "afterUpdate", afterUpdate);

    return () => {
      Matter.Events.off(engine, "afterUpdate", afterUpdate);
      Matter.Events.off(render, "afterRender", afterRender);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
      physicsRef.current = null;
    };
  }, [ballRadius, multipliers, rows, pegSpacingX, pegSpacingY, slotTop]);

  const drop = () => {
    const physics = physicsRef.current;
    if (!physics) {
      return;
    }

    const totalBet = bet * ballCount;
    const check = validateBet(totalBet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }

    if (!removeCoins(check.bet)) {
      setMessage("Not enough fake coins for that bet.");
      return;
    }

    const perBallBet = Math.floor(check.bet / ballCount);
    physics.activeBet = perBallBet;
    physics.remaining += ballCount;

    for (let index = 0; index < ballCount; index += 1) {
      const ball = Matter.Bodies.circle(boardWidth / 2 + (Math.random() - 0.5) * 28, 30 - index * 2, ballRadius, {
        restitution: 0.62,
        friction: 0.001,
        frictionAir: 0.004,
        density: 0.004,
        render: {
          fillStyle: "#38bdf8",
          strokeStyle: "#ecfeff",
          lineWidth: 3
        }
      });
      const id = physics.nextBallId;
      physics.nextBallId += 1;
      ball.plugin.plinkoId = id;
      ball.plugin.resolved = false;
      ball.plugin.bet = perBallBet;
      ball.plugin.stuckSince = null;
      ball.plugin.bestY = ball.position.y;
      Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 1.6, y: index * -0.08 });
      Matter.Composite.add(physics.engine.world, ball);
      physics.balls.set(id, ball);
    }

    setDropping(true);
    setSlot(null);
    setMessage(`Spawned ${ballCount} more ball${ballCount === 1 ? "" : "s"}. Total fake bet: ${check.bet.toLocaleString()}.`);
  };

  return (
    <GameShell eyebrow="Plinko" title="Plinko" description="Tune difficulty and rows, then drop balls into fake-coin multiplier slots.">
      <div className="grid gap-6 xl:grid-cols-[445px_1fr]">
        <Card className="space-y-5 bg-[#20284e]/80">
          <div className="flex gap-2">
            <button className="rounded-lg bg-blue-500/15 px-5 py-3 text-sm font-black text-white">Manual</button>
            <button className="rounded-lg px-5 py-3 text-sm font-bold text-slate-400">Auto</button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-400">Difficulty</p>
            <div className="flex gap-2">
              {difficultyOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => !dropping && setDifficulty(option)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-bold transition disabled:opacity-40",
                    difficulty === option ? "bg-blue-500 text-white shadow-neon" : "bg-white/8 text-slate-300 hover:bg-white/12"
                  )}
                  disabled={dropping}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400" htmlFor="plinko-bet">
              Bet amount
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/45 p-2">
              <input
                id="plinko-bet"
                type="number"
                min={1}
                value={bet}
                onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-black text-white outline-none"
              />
              <button
                onClick={() => setBet((current) => Math.max(1, Math.floor(current / 2)))}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40"
              >
                1/2
              </button>
              <button
                onClick={() => setBet((current) => Math.max(1, current * 2))}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40"
              >
                2x
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-400">Amount of rows</p>
            <div className="grid grid-cols-5 gap-2 rounded-lg bg-slate-900/35 p-2">
              {rowOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => !dropping && setRows(option)}
                  disabled={dropping}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-40",
                    rows === option ? "bg-blue-500/20 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400" htmlFor="plinko-balls">
              Amount of balls
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/45 p-2">
              <input
                id="plinko-balls"
                type="number"
                min={1}
                max={25}
                value={ballCount}
                onChange={(event) => setBallCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-black text-white outline-none"
              />
              {[1, 5, 10].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBallCount(amount)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-slate-300 disabled:opacity-40"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={drop} className="w-full">
            Drop {ballCount} ball{ballCount === 1 ? "" : "s"}
          </Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">{message}</p>
        </Card>

        <Card className="relative min-h-[560px] overflow-hidden bg-[#252e63]/90 p-0">
          <div className="absolute right-7 top-4 z-20 flex items-center gap-3 text-sm font-bold text-slate-300">
            <button className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
              <HelpCircle size={15} />
            </button>
            <button className="rounded-lg bg-white/5 px-4 py-2">History</button>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(59,130,246,.18),transparent_28%),radial-gradient(circle_at_72%_72%,rgba(15,23,42,.55),transparent_34%)]" />
          <div className="absolute inset-0 opacity-50 [clip-path:polygon(0_44%,16%_52%,27%_35%,36%_60%,47%_18%,59%_38%,73%_34%,88%_42%,100%_38%,100%_100%,0_100%)] bg-slate-950/30" />
          <div ref={boardRef} className="relative z-10 mx-auto aspect-[760/560] h-full max-h-[560px] w-full max-w-[760px] [&_canvas]:h-full [&_canvas]:w-full" />
        </Card>
      </div>
    </GameShell>
  );
}
