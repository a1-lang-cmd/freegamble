"use client";

import { useEffect, useState } from "react";
import { addCoins, getBalance, removeCoins, subscribeToBalance } from "@/lib/coins";
import { getSavedProfile, type AuthProfile } from "@/lib/supabase";

export function useCoins() {
  const [balance, setLocalBalance] = useState(1000);

  useEffect(() => {
    setLocalBalance(getSavedProfile()?.coins ?? getBalance());
    const unsubscribe = subscribeToBalance(setLocalBalance);
    const onProfile = (event: Event) => {
      const profile = (event as CustomEvent<AuthProfile | null>).detail;
      if (profile) {
        setLocalBalance(profile.coins);
      }
    };

    window.addEventListener("freegamble:profile", onProfile);
    return () => {
      unsubscribe();
      window.removeEventListener("freegamble:profile", onProfile);
    };
  }, []);

  return {
    balance,
    addCoins,
    removeCoins,
    refreshBalance: () => setLocalBalance(getBalance())
  };
}
