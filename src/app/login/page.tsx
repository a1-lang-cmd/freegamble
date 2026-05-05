"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { GameShell } from "@/components/GameShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { setBalance } from "@/lib/coins";
import { getSavedProfile, isDatabaseConfigured, logout, signIn, signUp, type AuthProfile } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Log in to save your fake-coin balance and appear on the public leaderboard.");

  useEffect(() => {
    setProfile(getSavedProfile());
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("Checking account...");

    try {
      const nextProfile = mode === "signup" ? await signUp(email, password, username) : await signIn(email, password);
      if (!nextProfile) {
        setMessage("Account created. Check your email if Supabase requires confirmation, then log in.");
      } else {
        setProfile(nextProfile);
        setBalance(nextProfile.coins);
        setMessage(`Logged in as ${nextProfile.username}. Your fake balance can now sync publicly.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    logout();
    setProfile(null);
    setMessage("Logged out on this browser.");
  };

  return (
    <GameShell eyebrow="Account" title="FreeGamble Login" description="Create a profile to sync fake coins and compete on the public leaderboard. No real money or real-world value.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-5">
          {!isDatabaseConfigured() && (
            <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
              Database is not configured yet. Add the Supabase environment variables in Vercel before public login works.
            </div>
          )}

          {profile ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-green-300/30 bg-green-300/10 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-green-100">Logged in</p>
                <h2 className="mt-2 text-3xl font-black text-white">{profile.username}</h2>
                <p className="mt-2 text-sm text-slate-300">{profile.email}</p>
                <p className="mt-4 text-xl font-black text-green-100">{profile.coins.toLocaleString()} fake coins</p>
              </div>
              <Button onClick={signOut} variant="danger" className="w-full">
                <LogOut size={18} />
                Log out
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900/45 p-2">
                <button type="button" onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 text-sm font-black ${mode === "login" ? "bg-cyan-300/15 text-white" : "text-slate-400"}`}>
                  Login
                </button>
                <button type="button" onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 text-sm font-black ${mode === "signup" ? "bg-purple-300/15 text-white" : "text-slate-400"}`}>
                  Sign up
                </button>
              </div>

              {mode === "signup" && (
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" required className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
              )}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={6} required className="w-full rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-3 font-black text-white outline-none focus:border-cyan-300" />

              <Button disabled={busy || !isDatabaseConfigured()} className="w-full">
                {mode === "signup" ? <UserPlus size={18} /> : <LogIn size={18} />}
                {busy ? "Working..." : mode === "signup" ? "Create profile" : "Log in"}
              </Button>
            </form>
          )}
        </Card>

        <Card className="space-y-4">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Public Profiles</p>
          <p className="text-sm leading-6 text-slate-300">
            Logged-in players save their fake coin balance to the database. The leaderboard shows usernames and fake balances only.
          </p>
          <p className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm font-bold leading-6 text-cyan-100">{message}</p>
        </Card>
      </div>
    </GameShell>
  );
}
