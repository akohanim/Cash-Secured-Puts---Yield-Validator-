import React, { useState } from 'react';
import { TradeCalculation, TradeInputs } from '../types';
import { analyzeTradeRisk } from '../services/geminiService';

interface GeminiInsightProps {
  inputs: TradeInputs;
  calculation: TradeCalculation | null;
  currentPrice: number;
}

export const GeminiInsight: React.FC<GeminiInsightProps> = ({ inputs, calculation, currentPrice }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!calculation) return;
    setLoading(true);
    const result = await analyzeTradeRisk(inputs, calculation, currentPrice);
    setAnalysis(result);
    setLoading(false);
  };

  if (!calculation) return null;

  return (
    <div className="mt-8 border-t border-slate-800 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
           <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
           Gemini 2.5 Risk Analysis
        </h3>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${loading ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
          >
            {loading ? 'Analyzing...' : 'Analyze Trade Risk'}
          </button>
        )}
      </div>

      {loading && (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6"></div>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
               <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
             </svg>
          </div>
          <div className="relative z-10">
            <p className="text-slate-300 leading-relaxed font-mono text-sm">{analysis}</p>
            <button 
                onClick={() => setAnalysis(null)}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
                Clear Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
