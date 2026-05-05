"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { CircleDot } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type Pick = "red" | "black" | "green";

type Pocket = {
  number: number;
  color: Pick;
};

type PhysicsRefs = {
  engine: Matter.Engine;
  render: Matter.Render;
  runner: Matter.Runner;
  ball: Matter.Body | null;
  wheelAngle: number;
  wheelVelocity: number;
  settling: boolean;
  bet: number;
  pick: Pick;
};

const boardSize = 430;
const center = boardSize / 2;
const wheelNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const pockets: Pocket[] = wheelNumbers.map((number) => ({
  number,
  color: number === 0 ? "green" : redNumbers.has(number) ? "red" : "black"
}));
const segmentAngle = 360 / pockets.length;
const deflectors = Array.from({ length: 18 }, (_, index) => index * (360 / 18));

function colorHex(color: Pick) {
  if (color === "red") return "#ef4444";
  if (color === "green") return "#22c55e";
  return "#020617";
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

export default function RoulettePage() {
  const physicsStageRef = useRef<HTMLDivElement | null>(null);
  const physicsRef = useRef<PhysicsRefs | null>(null);
  const frameRef = useRef<number | null>(null);
  const [bet, setBet] = useState(100);
  const [pick, setPick] = useState<Pick>("red");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Pocket | null>(null);
  const [message, setMessage] = useState("Choose a color and spin with fake coins only.");

  useEffect(() => {
    if (!physicsStageRef.current) {
      return;
    }

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }
    });
    const render = Matter.Render.create({
      element: physicsStageRef.current,
      engine,
      options: {
        width: boardSize,
        height: boardSize,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio
      }
    });
    const runner = Matter.Runner.create();

    const bodies = deflectors.map((angle) => {
      const radians = (angle * Math.PI) / 180;
      return Matter.Bodies.circle(center + Math.sin(radians) * 122, center - Math.cos(radians) * 122, 6, {
        isStatic: true,
        restitution: 1.08,
        friction: 0,
        render: {
          fillStyle: "rgba(255,255,255,.86)",
          strokeStyle: "rgba(34,211,238,.65)",
          lineWidth: 2
        }
      });
    });

    Matter.Composite.add(engine.world, bodies);
    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    physicsRef.current = {
      engine,
      render,
      runner,
      ball: null,
      wheelAngle: 0,
      wheelVelocity: 0,
      settling: false,
      bet: 0,
      pick: "red"
    };

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
      physicsRef.current = null;
    };
  }, []);

  const finishSpin = (outcome: Pocket) => {
    const physics = physicsRef.current;
    if (!physics) return;

    setResult(outcome);
    setSpinning(false);
    physics.settling = false;
    const multiplier = outcome.color === "green" ? 14 : 2;
    if (outcome.color === physics.pick) {
      const payout = physics.bet * multiplier;
      addCoins(payout);
      setMessage(`${outcome.number} ${outcome.color.toUpperCase()} hit. Won ${payout.toLocaleString()} fake coins at ${multiplier}x.`);
    } else {
      setMessage(`${outcome.number} ${outcome.color.toUpperCase()} hit. Fake bet lost.`);
    }
  };

  const spin = () => {
    const physics = physicsRef.current;
    if (!physics) return;

    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    if (!removeCoins(check.bet)) {
      setMessage("Not enough fake coins for that bet.");
      return;
    }

    if (physics.ball) {
      Matter.Composite.remove(physics.engine.world, physics.ball);
    }

    const startAngle = Math.random() * Math.PI * 2;
    const ball = Matter.Bodies.circle(center + Math.cos(startAngle) * 172, center + Math.sin(startAngle) * 172, 10, {
      restitution: 0.94,
      friction: 0,
      frictionAir: 0.006,
      density: 0.004,
      render: {
        fillStyle: "#ffffff",
        strokeStyle: "#020617",
        lineWidth: 4
      }
    });

    Matter.Body.setVelocity(ball, {
      x: -Math.sin(startAngle) * (18 + Math.random() * 3),
      y: Math.cos(startAngle) * (18 + Math.random() * 3)
    });
    Matter.Composite.add(physics.engine.world, ball);

    physics.ball = ball;
    physics.wheelVelocity = 7.8 + Math.random() * 1.2;
    physics.settling = true;
    physics.bet = check.bet;
    physics.pick = pick;
    setResult(null);
    setSpinning(true);
    setMessage("Ball is live. It will bounce off the pins and settle into a pocket.");

    let lastTime = performance.now();
    const tick = (time: number) => {
      if (!physicsRef.current?.ball) return;
      const current = physicsRef.current;
      if (!current.ball) return;
      const dt = Math.min(0.034, (time - lastTime) / 1000);
      lastTime = time;
      const activeBall = current.ball;

      current.wheelAngle += current.wheelVelocity * dt * 57.2958;
      current.wheelVelocity *= 0.992;
      setRotation(current.wheelAngle);

      const dx = activeBall.position.x - center;
      const dy = activeBall.position.y - center;
      const radius = Math.max(1, Math.hypot(dx, dy));
      const targetRadius = current.wheelVelocity > 2.2 ? 170 : current.wheelVelocity > 0.8 ? 143 : 130;
      const radialForce = (targetRadius - radius) * 0.000012;
      Matter.Body.applyForce(activeBall, activeBall.position, {
        x: (dx / radius) * radialForce,
        y: (dy / radius) * radialForce
      });

      if (radius > 178) {
        Matter.Body.applyForce(activeBall, activeBall.position, {
          x: (-dx / radius) * 0.002,
          y: (-dy / radius) * 0.002
        });
      }

      if (current.wheelVelocity < 0.45 && activeBall.speed < 0.45 && radius < 138) {
        const ballAngle = normalizeAngle((Math.atan2(activeBall.position.x - center, center - activeBall.position.y) * 180) / Math.PI);
        const relativeAngle = normalizeAngle(ballAngle - current.wheelAngle);
        const index = Math.floor(relativeAngle / segmentAngle) % pockets.length;
        const pocketCenter = (index * segmentAngle + segmentAngle / 2 + current.wheelAngle) * (Math.PI / 180);
        Matter.Body.setPosition(activeBall, {
          x: center + Math.sin(pocketCenter) * 132,
          y: center - Math.cos(pocketCenter) * 132
        });
        Matter.Body.setVelocity(activeBall, { x: 0, y: 0 });
        finishSpin(pockets[index]);
        return;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = window.requestAnimationFrame(tick);
  };

  return (
    <GameShell eyebrow="Roulette" title="Neon Roulette Table" description="Pick red, black, or green. Red and black pay 2x; green pays 14x. Fake coins only.">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="relative grid min-h-[430px] place-items-center overflow-hidden bg-[#252e63]/90 p-4 sm:min-h-[540px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,.16),transparent_34%),radial-gradient(circle_at_70%_75%,rgba(168,85,247,.18),transparent_30%)]" />
          <div className="relative z-10 grid aspect-square w-full max-w-[430px] place-items-center">
            <div
              className="absolute grid h-[89%] w-[89%] place-items-center rounded-full border-[10px] border-slate-950/80 shadow-purple"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(${pockets
                  .map((pocket, index) => `${colorHex(pocket.color)} ${(index / pockets.length) * 100}% ${((index + 1) / pockets.length) * 100}%`)
                  .join(", ")})`
              }}
            >
              {pockets.map((pocket, index) => {
                const angle = index * segmentAngle + segmentAngle / 2;
                return (
                  <span
                    key={pocket.number}
                    className="absolute left-1/2 top-1/2 text-[10px] font-black text-white drop-shadow"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-168px) rotate(90deg)`
                    }}
                  >
                    {pocket.number}
                  </span>
                );
              })}
              <div className="grid h-[42%] w-[42%] place-items-center rounded-full border-[8px] border-slate-800 bg-slate-950 text-white shadow-xl">
                <div className="grid h-[60%] w-[60%] place-items-center rounded-full border border-cyan-200/30 bg-cyan-300/10">
                  <CircleDot size={52} />
                </div>
              </div>
            </div>
            <div ref={physicsStageRef} className="absolute inset-0 z-20 [&_canvas]:h-full [&_canvas]:w-full" />
          </div>

          <div className="relative z-10 mt-2 text-center">
            <p className="text-2xl font-black text-white">
              {result ? `${result.number} ${result.color.toUpperCase()}` : "Ready to spin"}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-400">The ball collides with pins and settles into the pocket ring.</p>
          </div>
        </Card>

        <Card className="space-y-4">
          <label className="block text-sm font-bold text-slate-300" htmlFor="roulette-bet">
            Fake coin bet
          </label>
          <input
            id="roulette-bet"
            type="number"
            min={1}
            value={bet}
            disabled={spinning}
            onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))}
            className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300"
          />
          <div className="grid grid-cols-3 gap-2">
            {(["red", "black", "green"] as Pick[]).map((color) => (
              <button
                key={color}
                onClick={() => setPick(color)}
                disabled={spinning}
                className={cn(
                  "rounded-lg border px-3 py-3 text-sm font-black uppercase transition disabled:opacity-40",
                  pick === color ? "border-white bg-white/15 text-white" : "border-white/10 bg-white/5 text-slate-300"
                )}
              >
                {color}
              </button>
            ))}
          </div>
          <Button onClick={spin} disabled={spinning} className="w-full">Spin Roulette</Button>
          <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
