import { MarketData, ExpirationDate, OptionContract } from '../types';
import { API_KEY } from '../constants';

type MarketCallback = (data: MarketData) => void;
type LogCallback = (message: string) => void;

export class MarketDataService {
  private subscribers: Map<string, Set<MarketCallback>> = new Map();
  private logSubscribers: Set<LogCallback> = new Set();
  private currentTicker: string | null = null;
  private pollingInterval: number | null = null;
  private lastMarketData: MarketData | null = null;

  constructor() {}

  public subscribeLogs(callback: LogCallback): () => void {
    this.logSubscribers.add(callback);
    return () => this.logSubscribers.delete(callback);
  }

  private log(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMsg = `[${timestamp}] ${msg}`;
    this.logSubscribers.forEach(cb => cb(formattedMsg));
  }

  private error(msg: string, err?: any) {
     const timestamp = new Date().toLocaleTimeString();
     const formattedMsg = `[${timestamp}] ERROR: ${msg} ${err?.message || ''}`;
     this.logSubscribers.forEach(cb => cb(formattedMsg));
  }

  public subscribe(ticker: string, callback: MarketCallback): () => void {
    const upperTicker = ticker.toUpperCase();
    if (!this.subscribers.has(upperTicker)) {
      this.subscribers.set(upperTicker, new Set());
    }
    this.subscribers.get(upperTicker)?.add(callback);
    
    if (this.currentTicker !== upperTicker) {
      this.currentTicker = upperTicker;
      this.startPolling();
    } else if (this.lastMarketData) {
       callback(this.lastMarketData);
    }

    return () => {
      const subs = this.subscribers.get(upperTicker);
      subs?.delete(callback);
      if (subs?.size === 0) {
        this.subscribers.delete(upperTicker);
        if (this.subscribers.size === 0) this.stopPolling();
      }
    };
  }

  private stopPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = null;
    this.currentTicker = null;
  }

  private startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.fetchMetadata();
    // Poll metadata every minute
    this.pollingInterval = window.setInterval(() => this.fetchMetadata(), 60000); 
  }

  private async fetchMetadata() {
    if (!this.currentTicker) return;
    try {
      this.log(`Syncing underlying price for ${this.currentTicker}...`);
      
      const priceUrl = `https://api.polygon.io/v2/aggs/ticker/${this.currentTicker}/prev?adjusted=true&apiKey=${API_KEY}`;
      const priceRes = await fetch(priceUrl);
      const priceData = await priceRes.json();
      const currentPrice = priceData.results?.[0]?.c || 0;

      if (currentPrice === 0) throw new Error("Could not find underlying price.");

      this.log(`Mapping expiration dates for ${this.currentTicker}...`);
      const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${this.currentTicker}&contract_type=put&expired=false&limit=1000&apiKey=${API_KEY}`;
      const contractsRes = await fetch(contractsUrl);
      const contractsData = await contractsRes.json();

      if (!contractsData.results) throw new Error("No option contracts found.");

      const today = new Date();
      const expMap: Record<string, number> = {};
      
      contractsData.results.forEach((c: any) => {
        const exp = c.expiration_date;
        if (!expMap[exp]) {
           const dte = Math.ceil((new Date(exp).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
           if (dte >= 0) expMap[exp] = dte;
        }
      });

      const chain: ExpirationDate[] = Object.entries(expMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dte]) => ({
          date,
          daysToExpiration: dte,
          strikes: [] 
        }));

      contractsData.results.forEach((c: any) => {
        const dateObj = chain.find(e => e.date === c.expiration_date);
        if (dateObj) {
          dateObj.strikes.push({
            strike: c.strike_price,
            bid: null, ask: null, last: null, vol: null, oi: null, delta: null, theta: null,
            ticker: c.ticker 
          } as any);
        }
      });

      const data: MarketData = {
        ticker: this.currentTicker,
        currentPrice,
        lastUpdated: Date.now(),
        chain
      };

      this.lastMarketData = data;
      this.subscribers.get(this.currentTicker)?.forEach(cb => cb(data));
      this.log(`Metadata sync complete.`);

    } catch (e: any) {
      this.error(`Metadata sync failed`, e);
    }
  }

  /**
   * Waterfall Fetch for Option Quote
   * 1. Try NBBO (Real-time Bid)
   * 2. Fallback to Prev Close (Aggregates)
   */
  public async fetchContractQuote(optionTicker: string): Promise<Partial<OptionContract>> {
    try {
      this.log(`Attempting NBBO quote for ${optionTicker}...`);
      const nbboUrl = `https://api.polygon.io/v2/last/nbbo/${optionTicker}?apiKey=${API_KEY}`;
      const nbboRes = await fetch(nbboUrl);
      const nbboData = await nbboRes.json();
      
      let bid = nbboData.results?.p || 0;
      let ask = nbboData.results?.P || 0;

      // If NBBO is 0 (market closed or restricted), try Previous Close
      if (bid === 0) {
        this.log(`NBBO restricted/zero. Falling back to Prev Close for ${optionTicker}...`);
        const prevUrl = `https://api.polygon.io/v2/aggs/ticker/${optionTicker}/prev?adjusted=true&apiKey=${API_KEY}`;
        const prevRes = await fetch(prevUrl);
        const prevData = await prevRes.json();
        
        if (prevData.results?.[0]) {
          const lastClose = prevData.results[0].c;
          this.log(`Found Prev Close: $${lastClose}`);
          return {
            bid: lastClose, // Use close as best estimate for premium
            ask: lastClose,
            last: lastClose
          };
        }
      }

      return { bid, ask, last: bid };
    } catch (e) {
      this.error(`Quote fetch failed for ${optionTicker}`, e);
      return {};
    }
  }
}

export const marketService = new MarketDataService();