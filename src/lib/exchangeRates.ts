/**
 * Live exchange rates via https://www.exchangerate-api.com's free, keyless
 * endpoint (CORS-enabled, no auth). Rates are cached in localStorage per
 * base currency so repeated conversions don't refetch on every render.
 */
const RATES_ENDPOINT = "https://open.er-api.com/v6/latest";
const CACHE_PREFIX = "visit:rates:";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — rates update daily upstream

interface RatesResponse {
  result: string;
  rates: Record<string, number>;
}

interface CachedRates {
  fetchedAt: number;
  rates: Record<string, number>;
}

function readCache(base: string): CachedRates | null {
  const raw = localStorage.getItem(CACHE_PREFIX + base);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedRates;
  } catch {
    return null;
  }
}

function writeCache(base: string, rates: Record<string, number>): void {
  const entry: CachedRates = { fetchedAt: Date.now(), rates };
  localStorage.setItem(CACHE_PREFIX + base, JSON.stringify(entry));
}

/**
 * Returns a map of 1 `base` -> N `other currency`, fresh within the cache
 * window. Throws if there is no usable cache and the network fetch fails —
 * callers decide how to degrade (see useExchangeRates).
 */
export async function getRates(base: string): Promise<Record<string, number>> {
  const cached = readCache(base);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  try {
    const res = await fetch(`${RATES_ENDPOINT}/${base}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as RatesResponse;
    if (data.result !== "success" || !data.rates) {
      throw new Error("Unexpected response shape");
    }
    writeCache(base, data.rates);
    return data.rates;
  } catch (err) {
    if (cached) return cached.rates; // stale cache beats no conversion
    throw err;
  }
}

/** Converts an amount from `from` into `to` using rates quoted against `to`. */
export function convert(
  amount: number,
  from: string,
  to: string,
  ratesQuotedAgainstTo: Record<string, number>,
): number {
  if (from === to) return amount;
  const rate = ratesQuotedAgainstTo[from];
  if (!rate) return amount;
  return amount / rate;
}
