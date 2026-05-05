"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldAlert, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  addCoins,
  DEFAULT_STARTING_BALANCE,
  getBalance,
  getDailyRewardAmount,
  getStartingBalance,
  removeCoins,
  resetBalance,
  resetLocalUserData,
  setBalance,
  setDailyRewardAmount,
  setStartingBalance
} from "@/lib/coins";
import { useCoins } from "@/hooks/useCoins";

export default function AdminPage() {
  const { balance, refreshBalance } = useCoins();
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminConfigured, setAdminConfigured] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [manualBalance, setManualBalance] = useState(1000);
  const [coinAmount, setCoinAmount] = useState(1000);
  const [dailyAmount, setDailyAmount] = useState(350);
  const [startingAmount, setStartingAmount] = useState(DEFAULT_STARTING_BALANCE);
  const [message, setMessage] = useState("Admin controls affect only this browser's fake local data.");

  useEffect(() => {
    setManualBalance(getBalance());
    setDailyAmount(getDailyRewardAmount());
    setStartingAmount(getStartingBalance());
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data: { configured: boolean; loggedIn: boolean }) => {
        setAdminConfigured(data.configured);
        setLoggedIn(data.loggedIn);
        if (!data.configured) {
          setMessage("Admin key is not configured yet. Add FREEGAMBLE_ADMIN_KEY in Vercel.");
        }
      })
      .catch(() => setMessage("Could not check admin session."));
  }, []);

  const login = async () => {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: passwordInput })
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setMessage(data?.message ?? "Incorrect admin key.");
      return;
    }

    setLoggedIn(true);
    setPasswordInput("");
    setMessage("Admin session unlocked with the server key.");
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setMessage("Admin session locked.");
  };

  const applySetBalance = () => {
    setBalance(manualBalance);
    refreshBalance();
    setMessage(`Balance set to ${Math.max(0, Math.floor(manualBalance)).toLocaleString()} fake coins.`);
  };

  const applyAddCoins = () => {
    addCoins(coinAmount);
    refreshBalance();
    setMessage(`Added ${Math.max(0, Math.floor(coinAmount)).toLocaleString()} fake coins.`);
  };

  const applyRemoveCoins = () => {
    if (!removeCoins(coinAmount)) {
      setMessage("Could not remove that amount. Check the fake balance and amount.");
      return;
    }
    refreshBalance();
    setMessage(`Removed ${Math.max(0, Math.floor(coinAmount)).toLocaleString()} fake coins.`);
  };

  const applyStartingBalance = () => {
    setStartingBalance(startingAmount);
    setMessage(`Starting balance changed to ${Math.max(0, Math.floor(startingAmount)).toLocaleString()} fake coins.`);
  };

  const applyDailyReward = () => {
    setDailyRewardAmount(dailyAmount);
    setMessage(`Daily reward changed to ${Math.max(1, Math.floor(dailyAmount)).toLocaleString()} fake coins.`);
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.24em] text-rose-200">Local admin</p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Admin Control Room</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Manage this browser&apos;s free fake-coin balance and demo settings. No real money, Robux, deposits, withdrawals, or cashouts exist here.
          </p>
        </div>
        <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100 shadow-purple">
          Warning: these controls are client-side only and are intended for local testing of fake social casino coins.
        </div>
      </section>

      {!loggedIn ? (
        <Card className="mx-auto max-w-md border-rose-300/25">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg border border-rose-300/40 bg-rose-500/15 text-rose-100">
            <ShieldAlert />
          </div>
          <h2 className="text-2xl font-black text-white">Admin Login</h2>
          <p className="mt-2 text-sm text-slate-300">Enter your private server admin key to unlock tools.</p>
          {!adminConfigured && (
            <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
              Add FREEGAMBLE_ADMIN_KEY in Vercel before this login works.
            </p>
          )}
          <input
            type="password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && login()}
            className="mt-5 w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-rose-300"
            placeholder="Password"
          />
          <Button onClick={login} disabled={!adminConfigured} variant="danger" className="mt-4 w-full">
            Unlock Admin
          </Button>
          <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-300">{message}</p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Button onClick={logout} variant="ghost">
              <LogOut size={18} />
              Lock Admin
            </Button>
          </div>
          <Card className="space-y-4 border-purple-300/25">
            <h2 className="text-2xl font-black text-white">Balance Controls</h2>
            <motion.div animate={{ boxShadow: "0 0 28px rgba(168,85,247,.2)" }} className="rounded-lg border border-purple-300/30 bg-purple-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-200">Current balance</p>
              <p className="mt-2 text-4xl font-black text-white">{balance.toLocaleString()}</p>
            </motion.div>
            <input
              type="number"
              min={0}
              value={manualBalance}
              onChange={(event) => setManualBalance(Number(event.target.value) || 0)}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-purple-300"
            />
            <Button onClick={applySetBalance} variant="secondary" className="w-full">
              Set Balance Manually
            </Button>
            <input
              type="number"
              min={1}
              value={coinAmount}
              onChange={(event) => setCoinAmount(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-cyan-300"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={applyAddCoins}>Add Coins</Button>
              <Button onClick={applyRemoveCoins} variant="danger">Remove Coins</Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => { resetBalance(); refreshBalance(); setMessage("Balance reset to the configured starting amount."); }} variant="ghost">
                Reset Balance
              </Button>
              <Button onClick={() => { setBalance(1000000); refreshBalance(); setMessage("Granted 1,000,000 fake coins."); }} variant="secondary">
                Give 1,000,000
              </Button>
            </div>
          </Card>

          <Card className="space-y-4 border-rose-300/25">
            <h2 className="text-2xl font-black text-white">Game Controls</h2>
            <label className="block text-sm font-bold text-slate-300">Daily reward amount</label>
            <input
              type="number"
              min={1}
              value={dailyAmount}
              onChange={(event) => setDailyAmount(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-rose-300"
            />
            <Button onClick={applyDailyReward} variant="danger" className="w-full">
              Update Daily Reward
            </Button>
            <label className="block text-sm font-bold text-slate-300">Starting balance</label>
            <input
              type="number"
              min={0}
              value={startingAmount}
              onChange={(event) => setStartingAmount(Math.max(0, Number(event.target.value) || 0))}
              className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-bold text-white outline-none focus:border-purple-300"
            />
            <Button onClick={applyStartingBalance} variant="secondary" className="w-full">
              Change Starting Balance
            </Button>
            <Button
              onClick={() => {
                resetLocalUserData();
                refreshBalance();
                setMessage("Local balance and daily claim were reset.");
              }}
              variant="danger"
              className="w-full"
            >
              <Trash2 size={18} />
              Reset Local User Data
            </Button>
            <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">{message}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
