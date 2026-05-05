"use client";

import { DEFAULT_STARTING_BALANCE } from "@/lib/coins";

export type AuthProfile = {
  id: string;
  email: string;
  username: string;
  coins: number;
};

export type LeaderboardEntry = {
  username: string;
  coins: number;
  updated_at?: string;
};

const SESSION_KEY = "freegamble.supabaseSession";
const PROFILE_KEY = "freegamble.profile";

type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      username?: string;
    };
  };
};

const getConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url: url.replace(/\/$/, ""), anonKey } : null;
};

export function isDatabaseConfigured() {
  return Boolean(getConfig());
}

function authHeaders(token?: string) {
  const config = getConfig();
  if (!config) {
    throw new Error("Supabase is not configured.");
  }

  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${token ?? config.anonKey}`,
    "Content-Type": "application/json"
  };
}

function saveSession(session: SupabaseSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveProfile(profile: AuthProfile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("freegamble:profile", { detail: profile }));
}

export function getSavedProfile(): AuthProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthProfile;
  } catch {
    window.localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new CustomEvent("freegamble:profile", { detail: null }));
}

export async function signUp(email: string, password: string, username: string) {
  const config = getConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { username }
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg ?? data.error_description ?? "Signup failed.");
  }

  if (!data.session) {
    return null;
  }

  saveSession(data.session);
  return ensureProfile(username);
}

export async function signIn(email: string, password: string) {
  const config = getConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.msg ?? data.error_description ?? "Login failed.");
  }

  saveSession(data);
  return ensureProfile(data.user?.user_metadata?.username ?? email.split("@")[0]);
}

export async function ensureProfile(username: string) {
  const session = getSession();
  const config = getConfig();
  if (!session || !config) return null;

  const existingResponse = await fetch(`${config.url}/rest/v1/profiles?id=eq.${session.user.id}&select=id,email,username,coins`, {
    headers: authHeaders(session.access_token)
  });
  const existing = (await existingResponse.json()) as AuthProfile[];
  if (existing?.[0]) {
    saveProfile(existing[0]);
    return existing[0];
  }

  const profile = {
    id: session.user.id,
    email: session.user.email ?? "",
    username: username.trim() || "FreeGambler",
    coins: DEFAULT_STARTING_BALANCE
  };

  const createResponse = await fetch(`${config.url}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...authHeaders(session.access_token), Prefer: "return=representation" },
    body: JSON.stringify(profile)
  });
  const created = (await createResponse.json()) as AuthProfile[];
  if (!createResponse.ok) {
    throw new Error("Could not create profile. Try another username.");
  }

  saveProfile(created[0]);
  return created[0];
}

export async function updateRemoteCoins(coins: number) {
  const session = getSession();
  const profile = getSavedProfile();
  const config = getConfig();
  if (!session || !profile || !config) return;

  const nextCoins = Math.max(0, Math.floor(coins));
  await fetch(`${config.url}/rest/v1/profiles?id=eq.${session.user.id}`, {
    method: "PATCH",
    headers: authHeaders(session.access_token),
    body: JSON.stringify({ coins: nextCoins, updated_at: new Date().toISOString() })
  });
  saveProfile({ ...profile, coins: nextCoins });
}

export async function fetchLeaderboard() {
  const config = getConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/rest/v1/profiles?select=username,coins,updated_at&order=coins.desc&limit=50`, {
    headers: authHeaders()
  });
  if (!response.ok) return null;
  return (await response.json()) as LeaderboardEntry[];
}
