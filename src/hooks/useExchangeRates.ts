import { useEffect, useState } from "react";
import { getRates } from "../lib/exchangeRates";

interface RatesState {
  rates: Record<string, number> | null;
  loading: boolean;
  error: string | null;
}

/** Fetches (and caches) rates quoted against `base`. Refetches when base changes. */
export function useExchangeRates(base: string): RatesState {
  const [state, setState] = useState<RatesState>({
    rates: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ rates: null, loading: true, error: null });
    getRates(base)
      .then((rates) => {
        if (!cancelled) setState({ rates, loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled)
          setState({
            rates: null,
            loading: false,
            error: "Не удалось получить курс валют — суммы в разных валютах не будут сконвертированы",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [base]);

  return state;
}
