export const DEFAULT_STARTING_BALANCE = 1000;
export const DEFAULT_DAILY_REWARD = 350;
export const BALANCE_KEY = "freegamble.balance";
export const DAILY_CLAIM_KEY = "freegamble.lastDailyClaim";
export const STARTING_BALANCE_KEY = "freegamble.startingBalance";
export const DAILY_REWARD_AMOUNT_KEY = "freegamble.dailyRewardAmount";

const listeners = new Set<(balance: number) => void>();

const hasStorage = () => typeof window !== "undefined" && Boolean(window.localStorage);

export function getBalance(): number {
  if (!hasStorage()) {
    return DEFAULT_STARTING_BALANCE;
  }

  const stored = window.localStorage.getItem(BALANCE_KEY);
  if (!stored) {
    const startingBalance = getStartingBalance();
    window.localStorage.setItem(BALANCE_KEY, String(startingBalance));
    return startingBalance;
  }

  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : getStartingBalance();
}

export function setBalance(balance: number) {
  if (!hasStorage()) {
    return;
  }

  const normalized = Math.max(0, Math.floor(balance));
  window.localStorage.setItem(BALANCE_KEY, String(normalized));
  listeners.forEach((listener) => listener(normalized));
  import("@/lib/supabase")
    .then(({ updateRemoteCoins }) => updateRemoteCoins(normalized))
    .catch(() => undefined);
}

export function addCoins(amount: number) {
  setBalance(getBalance() + Math.max(0, Math.floor(amount)));
}

export function removeCoins(amount: number): boolean {
  const cost = Math.floor(amount);
  if (!Number.isFinite(cost) || cost <= 0) {
    return false;
  }

  const current = getBalance();
  if (current < cost) {
    return false;
  }

  setBalance(current - cost);
  return true;
}

export function subscribeToBalance(listener: (balance: number) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canClaimDaily(now = Date.now()) {
  if (!hasStorage()) {
    return false;
  }

  const lastClaim = Number(window.localStorage.getItem(DAILY_CLAIM_KEY) ?? 0);
  return !lastClaim || now - lastClaim >= 24 * 60 * 60 * 1000;
}

export function getDailyRewardAmount() {
  if (!hasStorage()) {
    return DEFAULT_DAILY_REWARD;
  }

  const stored = Number(window.localStorage.getItem(DAILY_REWARD_AMOUNT_KEY));
  return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : DEFAULT_DAILY_REWARD;
}

export function setDailyRewardAmount(amount: number) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(DAILY_REWARD_AMOUNT_KEY, String(Math.max(1, Math.floor(amount))));
}

export function getStartingBalance() {
  if (!hasStorage()) {
    return DEFAULT_STARTING_BALANCE;
  }

  const stored = Number(window.localStorage.getItem(STARTING_BALANCE_KEY));
  return Number.isFinite(stored) && stored >= 0 ? Math.floor(stored) : DEFAULT_STARTING_BALANCE;
}

export function setStartingBalance(amount: number) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(STARTING_BALANCE_KEY, String(Math.max(0, Math.floor(amount))));
}

export function claimDailyReward(amount = getDailyRewardAmount()): boolean {
  if (!hasStorage() || !canClaimDaily()) {
    return false;
  }

  window.localStorage.setItem(DAILY_CLAIM_KEY, String(Date.now()));
  addCoins(amount);
  return true;
}

export function resetBalance() {
  setBalance(getStartingBalance());
}

export function resetLocalUserData() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(BALANCE_KEY);
  window.localStorage.removeItem(DAILY_CLAIM_KEY);
  setBalance(getStartingBalance());
}

export function validateBet(amount: number): { ok: true; bet: number } | { ok: false; message: string } {
  const bet = Math.floor(amount);
  if (!Number.isFinite(bet) || bet <= 0) {
    return { ok: false, message: "Enter a positive fake-coin bet." };
  }

  if (bet > getBalance()) {
    return { ok: false, message: "You do not have enough fake coins for that bet." };
  }

  return { ok: true, bet };
}
