import React, { useRef } from 'react';
import { ExpirationDate } from '../types';

interface ExpirationSelectorProps {
  chain: ExpirationDate[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export const ExpirationSelector: React.FC<ExpirationSelectorProps> = ({ chain, selectedDate, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (chain.length === 0) {
    return (
      <div className="mb-6 p-4 rounded-lg bg-rose-950/20 border border-rose-900/50 text-center">
        <p className="text-sm text-rose-400 font-medium">No valid option contracts found for this ticker.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 relative group">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-4 px-1">
        Select Expiration <span className="text-slate-700 ml-2">/ Sliding Bar</span>
      </h3>
      
      {/* Container with gradient edges */}
      <div className="relative">
        {/* Left Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 pb-4 px-1 no-scrollbar snap-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {chain.map((exp) => (
            <button
              key={exp.date}
              onClick={() => onSelect(exp.date)}
              className={`
                flex-shrink-0 snap-start flex flex-col items-center justify-center w-24 h-24 rounded-xl border transition-all duration-300
                ${selectedDate === exp.date 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/20 scale-105' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}
              `}
            >
              <span className={`text-2xl font-mono font-black ${selectedDate === exp.date ? 'text-white' : 'text-slate-200'}`}>
                {exp.daysToExpiration}d
              </span>
              <span className={`text-[10px] mt-1 font-medium ${selectedDate === exp.date ? 'text-indigo-200' : 'text-slate-500'}`}>
                {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </button>
          ))}
        </div>

        {/* Right Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};