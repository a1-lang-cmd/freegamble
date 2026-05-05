"use client";

import { useMemo, useState } from "react";
import { Hand, HelpCircle, Info, ShieldQuestion, Volume2 } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addCoins, removeCoins, validateBet } from "@/lib/coins";
import { cn } from "@/lib/cn";

type CardSuit = "S" | "H" | "D" | "C";
type PlayingCard = {
  rank: string;
  suit: CardSuit;
};
type Phase = "betting" | "player" | "dealer" | "complete";

const suits: CardSuit[] = ["S", "H", "D", "C"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function makeDeck() {
  return suits.flatMap((suit) => ranks.map((rank) => ({ rank, suit }))).sort(() => Math.random() - 0.5);
}

function cardValue(card: PlayingCard) {
  if (card.rank === "A") return 11;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  return Number(card.rank);
}

function handValue(hand: PlayingCard[]) {
  let total = hand.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = hand.filter((card) => card.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function isBlackjack(hand: PlayingCard[]) {
  return hand.length === 2 && handValue(hand) === 21;
}

function draw(deck: PlayingCard[]) {
  const nextDeck = deck.length > 8 ? [...deck] : makeDeck();
  const card = nextDeck.pop()!;
  return { card, deck: nextDeck };
}

function suitColor(suit: CardSuit) {
  return suit === "H" || suit === "D" ? "text-red-700" : "text-slate-950";
}

export default function BlackjackPage() {
  const [bet, setBet] = useState(25);
  const [activeBet, setActiveBet] = useState(0);
  const [deck, setDeck] = useState<PlayingCard[]>(() => makeDeck());
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [phase, setPhase] = useState<Phase>("betting");
  const [message, setMessage] = useState("Place a fake-coin bet to start a blackjack hand.");
  const [hints, setHints] = useState(false);

  const playerTotal = useMemo(() => handValue(playerHand), [playerHand]);
  const dealerTotal = useMemo(() => handValue(dealerHand), [dealerHand]);
  const dealerVisibleTotal = phase === "player" ? handValue(dealerHand.slice(0, 1)) : dealerTotal;

  const settle = (nextPlayerHand: PlayingCard[], nextDealerHand: PlayingCard[], currentBet: number) => {
    const playerScore = handValue(nextPlayerHand);
    const dealerScore = handValue(nextDealerHand);
    let payout = 0;
    let nextMessage = "";

    if (playerScore > 21) {
      nextMessage = "Player bust. Fake bet lost.";
    } else if (dealerScore > 21 || playerScore > dealerScore) {
      payout = currentBet * 2;
      nextMessage = `You win. ${payout.toLocaleString()} fake coins returned.`;
    } else if (playerScore === dealerScore) {
      payout = currentBet;
      nextMessage = `Push. ${payout.toLocaleString()} fake coins returned.`;
    } else {
      nextMessage = "Dealer wins. Fake bet lost.";
    }

    if (payout > 0) addCoins(payout);
    setPhase("complete");
    setMessage(nextMessage);
  };

  const placeBet = () => {
    const check = validateBet(bet);
    if (!check.ok) {
      setMessage(check.message);
      return;
    }
    if (!removeCoins(check.bet)) {
      setMessage("Not enough fake coins for that bet.");
      return;
    }

    let nextDeck = [...deck];
    const first = draw(nextDeck); nextDeck = first.deck;
    const dealerFirst = draw(nextDeck); nextDeck = dealerFirst.deck;
    const second = draw(nextDeck); nextDeck = second.deck;
    const dealerSecond = draw(nextDeck); nextDeck = dealerSecond.deck;
    const nextPlayerHand = [first.card, second.card];
    const nextDealerHand = [dealerFirst.card, dealerSecond.card];

    setDeck(nextDeck);
    setActiveBet(check.bet);
    setPlayerHand(nextPlayerHand);
    setDealerHand(nextDealerHand);

    if (isBlackjack(nextPlayerHand)) {
      const payout = Math.floor(check.bet * 2.5);
      addCoins(payout);
      setPhase("complete");
      setMessage(`Blackjack pays 3 to 2. ${payout.toLocaleString()} fake coins returned.`);
      return;
    }

    setPhase("player");
    setMessage("Hit, stand, or double. Dealer stands on 17.");
  };

  const hit = () => {
    if (phase !== "player") return;
    const next = draw(deck);
    const nextHand = [...playerHand, next.card];
    setDeck(next.deck);
    setPlayerHand(nextHand);
    if (handValue(nextHand) > 21) {
      settle(nextHand, dealerHand, activeBet);
    }
  };

  const stand = (overrideBet = activeBet, overridePlayerHand = playerHand) => {
    if (phase !== "player") return;
    setPhase("dealer");
    let nextDeck = [...deck];
    const nextDealerHand = [...dealerHand];
    while (handValue(nextDealerHand) < 17) {
      const next = draw(nextDeck);
      nextDeck = next.deck;
      nextDealerHand.push(next.card);
    }
    setDeck(nextDeck);
    setDealerHand(nextDealerHand);
    settle(overridePlayerHand, nextDealerHand, overrideBet);
  };

  const doubleDown = () => {
    if (phase !== "player") return;
    const check = validateBet(activeBet);
    if (!check.ok || !removeCoins(activeBet)) {
      setMessage("Not enough fake coins to double.");
      return;
    }

    const next = draw(deck);
    const nextHand = [...playerHand, next.card];
    const doubledBet = activeBet * 2;
    setDeck(next.deck);
    setPlayerHand(nextHand);
    setActiveBet(doubledBet);

    if (handValue(nextHand) > 21) {
      settle(nextHand, dealerHand, doubledBet);
      return;
    }

    stand(doubledBet, nextHand);
  };

  const resetHand = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setActiveBet(0);
    setPhase("betting");
    setMessage("Place a fake-coin bet to start a blackjack hand.");
  };

  const hint = playerTotal >= 17 ? "Stand" : playerTotal <= 11 ? "Hit or double" : "Hit against strong dealer cards";

  return (
    <GameShell eyebrow="Blackjack" title="Neon Blackjack Table" description="Play a free fake-coin blackjack hand. Blackjack pays 3 to 2, dealer stands on 17, and coins have no real-world value.">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(320px,408px)_minmax(0,1fr)]">
        <Card className="space-y-6 bg-[#20284e]/80">
          <div className="flex gap-2">
            <button className="rounded-lg bg-blue-500/15 px-5 py-3 text-sm font-black text-white">Manual</button>
            <button className="rounded-lg px-5 py-3 text-sm font-bold text-slate-400">Auto</button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-400" htmlFor="blackjack-bet">Bet amount</label>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/45 p-2">
              <input id="blackjack-bet" type="number" min={1} value={bet} disabled={phase !== "betting"} onChange={(event) => setBet(Math.max(1, Number(event.target.value) || 1))} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-black text-white outline-none" />
              <button onClick={() => setBet((current) => Math.max(1, Math.floor(current / 2)))} disabled={phase !== "betting"} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">1/2</button>
              <button onClick={() => setBet((current) => current * 2)} disabled={phase !== "betting"} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-slate-300 disabled:opacity-40">2x</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={hit} disabled={phase !== "player"}>Hit <Hand size={16} /></Button>
            <Button onClick={() => stand()} disabled={phase !== "player"} variant="ghost">Stand</Button>
            <Button onClick={doubleDown} disabled={phase !== "player" || playerHand.length !== 2} variant="ghost">Double</Button>
            <Button disabled variant="ghost">Split</Button>
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-300">
            <button onClick={() => setHints((value) => !value)} className={cn("h-5 w-9 rounded-full border transition", hints ? "border-cyan-200 bg-cyan-300/30" : "border-white/10 bg-white/10")}>
              <span className={cn("block h-4 w-4 rounded-full bg-white transition", hints && "translate-x-4")} />
            </button>
            Basic Strategy Hints
            <Info size={15} />
          </label>

          {hints && <p className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-3 text-sm font-bold text-cyan-100">Hint: {hint}</p>}

          <div className="pt-24">
            {phase === "betting" || phase === "complete" ? (
              <Button onClick={phase === "complete" ? resetHand : placeBet} className="w-full">
                {phase === "complete" ? "New hand" : "Place bet"}
              </Button>
            ) : (
              <Button disabled className="w-full">Hand in progress</Button>
            )}
          </div>
          <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">{message}</p>
        </Card>

        <Card className="relative min-h-[500px] overflow-hidden bg-[#252e63]/90 p-0 sm:min-h-[548px]">
          <div className="absolute right-5 top-4 z-20 flex items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-200"><Volume2 size={16} /></button>
            <button className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-200"><HelpCircle size={16} /></button>
            <button className="rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">History</button>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-18%,rgba(15,23,42,.72)_0_45%,transparent_46%),radial-gradient(circle_at_50%_35%,rgba(59,130,246,.18),transparent_36%)]" />
          <div className="absolute left-1/2 top-1/2 h-[min(620px,90vw)] w-[min(920px,135vw)] -translate-x-1/2 -translate-y-[68%] rounded-full border-[22px] border-slate-950/30" />
          <div className="absolute left-1/2 top-[35%] z-10 -translate-x-1/2 text-center">
            <div className="rounded-md bg-blue-500/15 px-6 py-3 text-xs font-black uppercase tracking-wide text-slate-200 shadow-purple sm:px-20 sm:text-sm">Blackjack pays 3 to 2</div>
            <p className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-400">Insurance pays 2 to 1</p>
          </div>

          <div className="absolute left-1/2 top-14 z-10 -translate-x-1/2 text-center">
            <p className="mb-2 text-sm font-black text-slate-300">Dealer {phase === "player" ? dealerVisibleTotal : dealerTotal || ""}</p>
            <div className="flex min-h-24 justify-center gap-3">
              {dealerHand.map((card, index) => (
                <PlayingCardView key={`${card.rank}-${card.suit}-${index}`} card={card} hidden={phase === "player" && index === 1} />
              ))}
            </div>
          </div>

          <div className="absolute bottom-12 left-1/2 z-10 -translate-x-1/2 text-center">
            <div className="flex min-h-28 justify-center gap-3">
              {playerHand.map((card, index) => (
                <PlayingCardView key={`${card.rank}-${card.suit}-${index}`} card={card} />
              ))}
            </div>
            <p className="mt-3 text-sm font-black text-slate-300">Player {playerTotal || ""}</p>
            {activeBet > 0 && <p className="mt-1 text-xs font-bold text-cyan-200">Bet {activeBet.toLocaleString()} fake coins</p>}
          </div>

          {playerHand.length === 0 && (
            <div className="absolute bottom-24 left-1/2 z-10 grid h-24 w-16 -translate-x-1/2 place-items-center rounded-lg border border-white/15 text-slate-500">
              <ShieldQuestion />
            </div>
          )}
        </Card>
      </div>
    </GameShell>
  );
}

function PlayingCardView({ card, hidden = false }: { card: PlayingCard; hidden?: boolean }) {
  if (hidden) {
    return <div className="h-24 w-16 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-300 to-orange-500 shadow-purple" />;
  }

  return (
    <div className="flex h-24 w-16 flex-col justify-between rounded-lg border border-white/20 bg-slate-50 p-2 text-slate-950 shadow-xl">
      <span className={cn("text-left text-lg font-black", suitColor(card.suit))}>{card.rank}</span>
      <span className={cn("text-center text-xl font-black", suitColor(card.suit))}>{card.suit}</span>
      <span className={cn("text-right text-lg font-black", suitColor(card.suit))}>{card.rank}</span>
    </div>
  );
}
