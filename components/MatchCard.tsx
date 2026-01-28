
import React, { useState } from 'react';
import { CricketMatch, AIEdge, MarketLine } from '../types';
import { 
  BrainCircuit, Radar, Globe, Loader2, Target, MessageCircle, ExternalLink, Users, ShieldCheck, Zap
} from 'lucide-react';

interface MatchCardProps {
  match: CricketMatch;
  edges: AIEdge[];
  membership: string;
  strategyOnlyView: boolean;
  excludeAvoidMarkets: boolean;
  excludeVariancePlays: boolean;
  onTrade: (match: CricketMatch, edge: AIEdge, line: MarketLine, side: 'BACK' | 'LAY') => void;
  onRequestIntelligence: (matchId: string, manualKnowledge: string) => void;
  onRunRecon: (matchId: string) => void;
  isAnalyzing: boolean;
  isReconLoading: boolean;
  pulseData?: { text: string, sources: any[] };
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, edges, onTrade, onRequestIntelligence, isAnalyzing, pulseData
}) => {
  const [manualKnowledge, setManualKnowledge] = useState("");

  return (
    <div className="bg-[#0a0a0c] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-10 animate-fade-in group relative">
      <div className="p-8 border-b border-white/5 bg-[#111114]/80 backdrop-blur-md relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-start gap-5">
            <div className="relative">
              <div className="w-1.5 h-16 bg-gradient-to-b from-indigo-500 to-cyan-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-[900] tracking-tighter uppercase text-white leading-none">
                {match.teamA} <span className="text-gray-700 text-xl font-black italic">VS</span> {match.teamB}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                  <Globe className="w-3 h-3 text-gray-500" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{match.venue}</span>
                </div>
                <div className="text-[10px] font-mono text-cyan-400 font-bold">{match.scoreA} ({match.overs})</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-black/40 rounded-3xl border border-white/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Personal Knowledge Overlay</span>
            </div>
            <textarea 
              value={manualKnowledge}
              onChange={(e) => setManualKnowledge(e.target.value)}
              placeholder="Inject knowledge (e.g. Fielders look slow, Dew setting in...)"
              className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-xs font-medium text-white focus:outline-none focus:border-cyan-500/50 min-h-[80px]"
            />
          </div>

          <button 
            disabled={isAnalyzing} 
            onClick={() => onRequestIntelligence(match.id, manualKnowledge)} 
            className="w-full py-6 bg-indigo-600 border border-indigo-400 rounded-[28px] text-[11px] font-black uppercase tracking-[0.4em] text-white flex items-center justify-center gap-4 active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:brightness-110"
          >
            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <BrainCircuit className="w-7 h-7" />}
            {isAnalyzing ? 'SYNCHRONIZING EXPERTS...' : 'GENERATE AI CONSENSUS'}
          </button>
        </div>

        {pulseData && pulseData.sources.length > 0 && (
          <div className="bg-black/30 rounded-2xl border border-white/5 p-4 mb-6">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-2">Grounding Sources</span>
            <div className="flex flex-wrap gap-2">
              {pulseData.sources.map((s, i) => (
                <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/10 hover:bg-white/10">
                  <ExternalLink className="w-2 h-2 text-indigo-400" />
                  <span className="text-[7px] font-black uppercase truncate max-w-[80px] text-gray-400">{s.web?.title || 'Source'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-8 space-y-8">
        {match.marketLines.map((line) => {
          const edge = edges.find(e => e.marketId === line.id);
          const isFullConsensus = edge && edge.confidence >= 90;

          return (
            <div key={line.id} className={`rounded-[36px] border transition-all p-7 bg-[#16161a] border-white/5 ${edge ? 'border-indigo-500/40 shadow-xl' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-gray-500">{line.label}</span>
                {edge && (
                  <div className="flex items-center gap-2">
                     <div className="flex -space-x-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-3 h-3 rounded-full border border-black ${i < (edge.confidence / 33) ? 'bg-indigo-500' : 'bg-gray-800'}`} />
                        ))}
                     </div>
                     <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Expert Consensus</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button onClick={() => onTrade(match, edge || {} as AIEdge, line, 'BACK')} className={`flex-1 py-5 rounded-[24px] border flex flex-col items-center gap-1 transition-all ${edge ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[#24242b] border-indigo-500/20 text-indigo-400'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest">Back</span>
                  <span className="text-2xl font-[900] font-mono">{line.backOdds}</span>
                </button>
                <button onClick={() => onTrade(match, edge || {} as AIEdge, line, 'LAY')} className={`flex-1 py-5 rounded-[24px] border flex flex-col items-center gap-1 transition-all ${edge ? 'bg-cyan-600 text-white shadow-lg' : 'bg-[#24242b] border-cyan-500/20 text-cyan-400'}`}>
                  <span className="text-[9px] font-black uppercase tracking-widest">Lay</span>
                  <span className="text-2xl font-[900] font-mono">{line.layOdds}</span>
                </button>
              </div>

              {edge && (
                <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{edge.edgeType} EDGE</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic">"{edge.observation}"</p>
                  <div className="flex flex-wrap gap-2">
                    {edge.structuralReasoning?.map((r, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[7px] text-gray-500 font-bold uppercase tracking-widest">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchCard;
