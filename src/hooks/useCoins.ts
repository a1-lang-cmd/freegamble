"use client";

import { useEffect, useState } from "react";
import { addCoins, getBalance, removeCoins, subscribeToBalance } from "@/lib/coins";

export function useCoins() {
  const [balance, setLocalBalance] = useState(1000);

  useEffect(() => {
    setLocalBalance(getBalance());
    const unsubscribe = subscribeToBalance(setLocalBalance);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    balance,
    addCoins,
    removeCoins,
    refreshBalance: () => setLocalBalance(getBalance())
  };
}
