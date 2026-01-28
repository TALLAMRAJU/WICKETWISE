
import React, { useState, useEffect } from 'react';
import { CricketMatch, AIEdge, MarketLine } from '../types';
import { 
  BrainCircuit, Loader2, Zap, ArrowRightLeft, ShieldCheck, Database, Globe, Activity, Info, Link as LinkIcon, RefreshCw, Hash, ExternalLink, Timer, Trophy, ShieldAlert, MapPin, TrendingUp, TrendingDown
} from 'lucide-react';

interface MatchCardProps {
  match: CricketMatch;
  edges: AIEdge[];
  onRequestIntelligence: (matchId: string, manualKnowledge: string) => void;
  isAnalyzing: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, edges, onRequestIntelligence, isAnalyzing
}) => {
  const [manualKnowledge, setManualKnowledge] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  useEffect(() => {
    setLastSyncTime(new Date());
  }, [match.marketLines, match.scoreA]);

  const getSourceBadge = () => {
    const source = match.marketLines[0]?.source;
    if (source === 'JEEBET') return { label: 'PRODUCTION SYNC', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (source === 'LIVE_EXCHANGE') return { label: 'AI OBSERVER', color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' };
    return { label: 'SIMULATED DATA', color: 'text-gray-400 border-white/10 bg-white/5' };
  };

  const calculateDrift = (current: number, initial?: number) => {
    if (!initial) return null;
    const diff = ((current - initial) / initial) * 100;
    return {
      value: Math.abs(diff).toFixed(1),
      isPositive: diff > 0,
      isSignificant: Math.abs(diff) > 15
    };
  };

  const badge = getSourceBadge();

  return (
    <div className="bg-[#0a0a0c] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl mb-12 animate-fade-in group relative border-t-indigo-500/20">
      {/* 1. Header Metadata Section */}
      <div className="bg-gradient-to-b from-[#16161a] to-[#0a0a0c] p-8 border-b border-white/5">
        <div className="flex justify-between items-start mb-6">
           <div className="flex flex-col gap-1">
              <div className={`px-4 py-1.5 rounded-full border text-[7px] font-[900] uppercase tracking-[0.2em] w-fit shadow-lg ${badge.color}`}>
                {badge.label}
              </div>
              <div className="flex items-center gap-2 mt-3">
                 <Globe className={`w-3 h-3 ${match.isLiveRealtime ? 'text-indigo-500' : 'text-gray-700'}`} />
                 <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500">{match.format} SERIES LIVE</span>
              </div>
           </div>
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{match.venue}</span>
              </div>
              <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">Network Node: SG-PROD</span>
           </div>
        </div>

        {/* 2. Teams & Score Progress Section */}
        <div className="flex flex-col gap-8">
           <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-3xl font-[900] text-white tracking-tighter uppercase italic leading-none">{match.teamA}</h3>
                <span className="text-[7px] font-black text-indigo-500/50 uppercase tracking-widest">Initial Odds: {match.startingOddsA || '---'}</span>
              </div>
              <div className="px-6 py-2 bg-white/5 rounded-full border border-white/5">
                <span className="text-gray-700 font-black text-sm italic tracking-tighter uppercase">VS</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <h3 className="text-3xl font-[900] text-white tracking-tighter uppercase italic leading-none">{match.teamB}</h3>
                <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">Initial Odds: {match.startingOddsB || '---'}</span>
              </div>
           </div>

           {/* 3. Real-time Status Statistics */}
           <div className="grid grid-cols-2 gap-4 bg-black/60 p-6 rounded-[32px] border border-white/5 shadow-inner">
              <div className="flex flex-col border-r border-white/5">
                 <span className="text-[7px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1">Innings Score</span>
                 <span className="text-3xl font-[900] text-cyan-400 mono tracking-tighter leading-none">{match.scoreA || '0/0'}</span>
              </div>
              <div className="flex flex-col pl-4">
                 <span className="text-[7px] font-black text-gray-600 uppercase tracking-[0.3em] mb-1">Match Progress</span>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-[900] text-white mono tracking-tighter leading-none">{match.overs || '0.0'}</span>
                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">OVERS</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. Action & AI Intelligence Section */}
      <div className="p-8 space-y-8">
        <div className="space-y-4">
          <textarea 
            value={manualKnowledge}
            onChange={(e) => setManualKnowledge(e.target.value)}
            placeholder="Inject Proprietary Rules or Match Context (e.g. Weather, Pitch, Injuries)..."
            className="w-full bg-black/40 border border-white/10 rounded-[28px] p-6 text-xs font-medium text-white focus:outline-none focus:border-indigo-500/50 min-h-[100px] transition-all placeholder:text-gray-700 shadow-inner resize-none"
          />

          <button 
            disabled={isAnalyzing} 
            onClick={() => onRequestIntelligence(match.id, manualKnowledge)} 
            className="w-full py-6 bg-indigo-600 border-b-4 border-indigo-900 rounded-[28px] text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center justify-center gap-4 active:scale-95 active:border-b-0 transition-all hover:brightness-110 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 scanline opacity-5 pointer-events-none" />
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
            CALCULATE VARIANCE & STRUCTURAL EDGE
          </button>
        </div>

        {/* 5. Markets Grid with Drift Tracking */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <Trophy className="w-4 h-4" /> Tactical Markets
            </h4>
            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Global Vol: ₹{match.marketLines.reduce((acc,l)=>acc+(l.totalMatched||0),0).toLocaleString()}</span>
          </div>

          <div className="space-y-4">
            {match.marketLines.map((line) => {
              const edge = edges.find(e => e.marketId === line.id);
              const drift = calculateDrift(line.backOdds, line.initialOdds);

              return (
                <div key={line.id} className="bg-[#111114] rounded-[40px] border border-white/5 p-8 transition-all hover:border-indigo-500/20 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                          <Activity className="w-4 h-4 text-indigo-400" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[12px] font-black uppercase tracking-widest text-white leading-none mb-1">{line.label}</span>
                          <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Type: {line.type}</span>
                       </div>
                    </div>
                    {drift && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${drift.isSignificant ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                        {drift.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-[8px] font-[900] uppercase tracking-widest">{drift.value}% DRIFT</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="py-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex flex-col items-center shadow-inner">
                      <span className="text-[8px] font-black uppercase text-indigo-400/40 mb-1 tracking-widest">Back Odds</span>
                      <span className="text-3xl font-[900] text-indigo-400 mono tracking-tighter">{line.backOdds.toFixed(2)}</span>
                    </div>
                    <div className="py-6 bg-pink-500/5 border border-pink-500/10 rounded-3xl flex flex-col items-center shadow-inner">
                      <span className="text-[8px] font-black uppercase text-pink-400/40 mb-1 tracking-widest">Lay Odds</span>
                      <span className="text-3xl font-[900] text-pink-400 mono tracking-tighter">{line.layOdds.toFixed(2)}</span>
                    </div>
                  </div>

                  {edge && (
                    <div className="mt-8 pt-8 border-t border-white/5 animate-fade-in space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                          <span className="text-[11px] font-[900] text-amber-400 uppercase tracking-[0.2em]">{edge.edgeType}</span>
                        </div>
                        <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 shadow-lg">
                           <span className="text-[10px] font-black text-white mono tracking-widest">{edge.confidence}% PROBABILITY</span>
                        </div>
                      </div>

                      <div className="bg-black/50 p-6 rounded-[32px] border border-white/5 italic relative shadow-inner">
                         <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BrainCircuit className="w-8 h-8 text-indigo-500" />
                         </div>
                         <p className="text-[11px] text-gray-400 font-medium leading-relaxed relative z-10">"{edge.observation}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-6 opacity-30">
           <Timer className="w-4 h-4 text-gray-700" />
           <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em]">Engine Heartbeat: {lastSyncTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
