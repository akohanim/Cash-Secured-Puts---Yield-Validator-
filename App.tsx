import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MarketData, TradeInputs, TradeCalculation, OptionContract } from './types';
import { DEFAULT_TARGET_APY, DEFAULT_TARGET_DISCOUNT, DEFAULT_TICKER } from './constants';
import { marketService } from './services/marketDataService';
import { InputPanel } from './components/InputPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ExpirationSelector } from './components/ExpirationSelector';
import { GeminiInsight } from './components/GeminiInsight';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [activeQuote, setActiveQuote] = useState<Partial<OptionContract> | null>(null);

  const [inputs, setInputs] = useState<TradeInputs>({
    ticker: DEFAULT_TICKER,
    targetAPY: DEFAULT_TARGET_APY,
    targetDiscount: DEFAULT_TARGET_DISCOUNT,
    selectedDate: null,
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeLogs = marketService.subscribeLogs((msg) => {
      setLogs(prev => [...prev.slice(-99), msg]);
      if (msg.includes('ERROR')) {
        setErrorMsg(msg.split('ERROR: ')[1] || 'Sync Error');
      }
    });
    return () => unsubscribeLogs();
  }, []);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  useEffect(() => {
    setInputs(prev => ({ ...prev, selectedDate: null }));
    setMarketData(null); 
    setErrorMsg(null);
    setActiveQuote(null);

    const unsubscribe = marketService.subscribe(inputs.ticker, (data) => {
      setMarketData(data);
      setErrorMsg(null);
    });

    return () => unsubscribe();
  }, [inputs.ticker]);

  // Secondary fetch for the specific targeted contract with retries
  useEffect(() => {
    let isMounted = true;
    const updateQuote = async () => {
      if (!marketData || !inputs.selectedDate) return;
      
      const currentPrice = marketData.currentPrice;
      const targetStrike = currentPrice * (1 - inputs.targetDiscount / 100);
      const expirationData = marketData.chain.find(exp => exp.date === inputs.selectedDate);
      
      if (!expirationData || expirationData.strikes.length === 0) return;

      const closest = expirationData.strikes.reduce((prev, curr) => {
        return (Math.abs(curr.strike - targetStrike) < Math.abs(prev.strike - targetStrike) ? curr : prev);
      });

      const optTicker = (closest as any).ticker;
      if (optTicker) {
        setFetchingQuote(true);
        const quote = await marketService.fetchContractQuote(optTicker);
        if (isMounted) {
          setActiveQuote(quote);
          setFetchingQuote(false);
        }
      }
    };

    updateQuote();
    return () => { isMounted = false; };
  }, [marketData, inputs.selectedDate, inputs.targetDiscount]);

  const calculation: TradeCalculation | null = useMemo(() => {
    if (!marketData || !inputs.selectedDate) return null;

    const currentPrice = marketData.currentPrice;
    const targetStrike = currentPrice * (1 - inputs.targetDiscount / 100);
    const expirationData = marketData.chain.find(exp => exp.date === inputs.selectedDate);
    
    if (!expirationData || expirationData.strikes.length === 0) return null;

    const closestOption = expirationData.strikes.reduce((prev, curr) => {
      return (Math.abs(curr.strike - targetStrike) < Math.abs(prev.strike - targetStrike) ? curr : prev);
    });

    const dte = expirationData.daysToExpiration;
    const strike = closestOption.strike;
    const collateral = strike * 100;
    const requiredTotalCredit = collateral * (inputs.targetAPY / 100) * (dte / 365);

    const mergedOption: OptionContract = {
      ...closestOption,
      bid: activeQuote?.bid ?? null,
      ask: activeQuote?.ask ?? null,
      last: activeQuote?.last ?? null
    };

    // Calculate premium - if bid is null/0 but last/close exists, use that
    const actualPremiumPerShare = mergedOption.bid || mergedOption.last || 0; 
    const actualTotalCredit = actualPremiumPerShare * 100;
    const actualAPY = collateral > 0 ? (actualTotalCredit / collateral) * (365 / dte) * 100 : 0;
    const netPurchasePrice = strike - actualPremiumPerShare;

    return {
      calculatedStrike: strike,
      collateral,
      dte,
      requiredTotalCredit,
      actualTotalCredit,
      actualAPY,
      netPurchasePrice,
      isTargetMet: actualTotalCredit >= requiredTotalCredit && actualTotalCredit > 0,
      actualPremiumPerShare,
      option: mergedOption
    };
  }, [marketData, inputs.selectedDate, inputs.targetAPY, inputs.targetDiscount, activeQuote]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-80 selection:bg-indigo-500/30">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-xl bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black font-mono shadow-lg shadow-indigo-600/20">
               CV
             </div>
             <h1 className="text-lg font-black tracking-tighter text-white uppercase">
               CSP <span className="text-indigo-500">PRO</span>
             </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-colors ${errorMsg ? 'bg-rose-950/20 text-rose-500 border-rose-900/50' : 'bg-indigo-950/20 text-indigo-400 border-indigo-900/50'}`}>
               <span className={`w-2 h-2 rounded-full mr-2 ${errorMsg ? 'bg-rose-500' : (fetchingQuote ? 'bg-amber-400 animate-ping' : 'bg-indigo-400 animate-pulse')}`}></span>
               {errorMsg ? 'SYNC ERROR' : (fetchingQuote ? 'FETCHING PREMIUM...' : 'DATA SYNCED')}
            </div>

            <div className="flex items-center space-x-4 bg-slate-950 rounded-2xl px-5 py-2 border border-slate-800">
              <span className="font-mono font-black text-indigo-400 uppercase text-sm">{inputs.ticker}</span>
              <span className="h-4 w-px bg-slate-800"></span>
              <span className={`font-mono font-bold text-sm ${!marketData ? 'animate-pulse text-slate-600' : 'text-slate-100'}`}>
                {marketData ? `$${marketData.currentPrice.toFixed(2)}` : 'SCANNING...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Validate CSP Yield.</h2>
          <p className="text-slate-500 leading-relaxed text-lg">
            Smart multi-step fetching ensures you get valid premium data even on free tier accounts by falling back to closing prices when live bids are restricted.
          </p>
          {errorMsg && (
            <div className="mt-6 p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl flex items-center gap-4">
              <span className="text-rose-500 text-xl font-bold">!</span>
              <p className="text-rose-400 text-sm font-bold uppercase tracking-wide">{errorMsg}</p>
            </div>
          )}
        </div>

        <InputPanel inputs={inputs} setInputs={setInputs} />

        {marketData && (
          <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800/40 backdrop-blur-sm">
             <ExpirationSelector 
               chain={marketData.chain} 
               selectedDate={inputs.selectedDate} 
               onSelect={(date) => setInputs(prev => ({ ...prev, selectedDate: date }))}
             />
             
             <div className={fetchingQuote ? 'opacity-40 grayscale blur-[1px] transition-all duration-300' : 'transition-all duration-300'}>
               <ResultsDisplay calculation={calculation} inputs={inputs} />
             </div>

             {calculation && marketData && !fetchingQuote && (
               <GeminiInsight 
                 inputs={inputs} 
                 calculation={calculation} 
                 currentPrice={marketData.currentPrice} 
               />
             )}
          </div>
        )}
      </main>

      <div className={`fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 transition-all duration-500 ease-in-out ${showLogs ? 'h-72' : 'h-12'}`}>
        <div 
          className="flex items-center justify-between px-6 h-12 bg-slate-900 cursor-pointer hover:bg-slate-850"
          onClick={() => setShowLogs(!showLogs)}
        >
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${logs.some(l => l.includes('ERROR')) ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
             Network Request Monitor
           </h3>
           <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{showLogs ? 'Hide Activity' : 'Show Activity'}</span>
        </div>
        
        {showLogs && (
          <div className="h-60 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed text-slate-400 bg-slate-950/50">
            {logs.map((log, i) => (
              <div key={i} className={`mb-1 border-l-2 pl-3 py-0.5 ${log.includes('ERROR') ? 'border-rose-800 bg-rose-950/10 text-rose-300' : 'border-slate-800'}`}>
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;