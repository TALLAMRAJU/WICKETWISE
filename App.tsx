
import React, { useState, useEffect, useCallback } from 'react';
import { CricketMatch, AIEdge, TradeLog, MarketLine, ExecutionConfig } from './types';
import { CricketDataService } from './services/cricketDataService';
import { GeminiService } from './services/geminiService';
import MatchCard from './components/MatchCard';
import PerformanceReview from './components/PerformanceReview';
import { 
  LayoutDashboard, History as HistoryIcon, BarChart3, Settings, 
  Loader2, CheckCircle2, AlertTriangle, Cpu
} from 'lucide-react';

const dataService = new CricketDataService();
const aiService = new GeminiService();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'performance' | 'settings'>('dashboard');
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [edges, setEdges] = useState<Record<string, AIEdge[]>>({});
  const [pulses, setPulses] = useState<Record<string, { text: string, sources: any[] }>>({});
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'warning' | 'info' | 'success'} | null>(null);

  const [trades, setTrades] = useState<TradeLog[]>(() => JSON.parse(localStorage.getItem('ww_trades_v5') || '[]'));
  const [executionConfig, setExecutionConfig] = useState<ExecutionConfig>(() => JSON.parse(localStorage.getItem('ww_config_v5') || JSON.stringify({
    autoTradingEnabled: false,
    maxExposurePerTrade: 1.5,
    minConsensusLevel: 2,
    strategyOnlyView: true,
    excludeAvoidMarkets: false,
    excludeVariancePlays: false,
    unitValue: 100,
    dataSource: 'MOCK',
    allowedFormats: ['T20', 'ODI', 'TEST']
  })));

  const pollData = useCallback(async () => {
    try {
      const liveMatches = await dataService.getLiveMatches(executionConfig.dataSource === 'BETFAIR');
      setMatches(liveMatches);
    } catch (e) {
      console.error("Polling failure:", e);
    }
  }, [executionConfig.dataSource]);

  useEffect(() => {
    pollData();
    const interval = setInterval(pollData, 15000);
    return () => clearInterval(interval);
  }, [pollData]);

  const requestIntelligence = async (matchId: string, manualKnowledge: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    try {
      setIsAnalyzingId(matchId);
      const pulse = await aiService.searchMarketPulse(match, manualKnowledge);
      setPulses(prev => ({ ...prev, [matchId]: pulse }));

      const analysis = await aiService.analyzeMatchStructure(match, pulse.text, manualKnowledge);
      if (analysis) {
        const formattedEdges: AIEdge[] = analysis.observations.map(obs => ({
          matchId, marketId: obs.marketId, edgeType: obs.type, 
          confidence: obs.confidence,
          observation: obs.reasoning[0] || "Structural edge detected.",
          structuralReasoning: obs.expertsConcurred || [],
          isLocked: false,
          timestamp: new Date().toISOString()
        }));

        setEdges(prev => ({ ...prev, [matchId]: formattedEdges }));
        
        // Automated Consensus Alert via WhatsApp Dispatch
        if (analysis.consensusLevel >= executionConfig.minConsensusLevel) {
          const topEdge = formattedEdges[0];
          const whatsappMsg = `⚛️ WICKETWISE CONSENSUS (${analysis.consensusLevel}/3)\nMatch: ${match.teamA} v ${match.teamB}\nEdge: ${topEdge.edgeType}\nNote: ${topEdge.observation}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
          setToast({ message: "Consensus Dispatch Sent", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }
      } else {
        setToast({ message: "Engine sync error. Check API Key.", type: 'warning' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      setToast({ message: "Neural link interrupted.", type: 'warning' });
    } finally {
      setIsAnalyzingId(null);
    }
  };

  const handleManualTrade = (match: CricketMatch, edge: AIEdge, line: MarketLine, side: 'BACK' | 'LAY') => {
    const newTrade: TradeLog = {
      id: Math.random().toString(36).substr(2, 9),
      matchId: match.id,
      matchName: `${match.teamA} v ${match.teamB}`,
      marketLabel: line.label,
      side,
      odds: side === 'BACK' ? line.backOdds : line.layOdds,
      units: 1.0,
      stake: executionConfig.unitValue,
      ruleId: edge?.edgeType || 'manual',
      status: 'MATCHED',
      timestamp: new Date().toISOString()
    };
    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);
    localStorage.setItem('ww_trades_v5', JSON.stringify(updatedTrades));
    setToast({ message: `EXECUTED ${side} @ ${newTrade.odds}`, type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-32 overflow-x-hidden">
      {toast && (
        <div className="fixed top-12 left-4 right-4 z-[3000] animate-bounce-in">
          <div className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400' : 'bg-red-600/90 border-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <AlertTriangle className="w-5 h-5 text-white" />}
            <span className="text-[10px] font-black uppercase tracking-widest text-white">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="px-6 pt-16 pb-8 border-b border-white/5 bg-black sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
           <div className="flex flex-col">
             <span className="text-2xl font-[900] tracking-tighter italic uppercase text-white leading-none">Wicket<span className="text-cyan-400">Wise</span></span>
             <span className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-500/80 mt-1">Stochastic Trading Engine</span>
           </div>
           <button onClick={() => setActiveTab('settings')} className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"><Settings className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Nodes: {matches.length}</span>
        </div>
      </header>

      <main className="px-4 pt-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {matches.map(m => (
              <MatchCard 
                key={m.id} match={m} edges={edges[m.id] || []} pulseData={pulses[m.id]}
                membership="PRO" strategyOnlyView={false} excludeAvoidMarkets={false} excludeVariancePlays={false}
                onTrade={handleManualTrade} onRequestIntelligence={requestIntelligence}
                onRunRecon={() => {}} isAnalyzing={isAnalyzingId === m.id} isReconLoading={false}
              />
            ))}
            {matches.length === 0 && (
              <div className="py-32 flex flex-col items-center opacity-40">
                <Loader2 className="w-10 h-10 animate-spin mb-6 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Aggregating Market Streams...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-6">
             <h2 className="text-3xl font-[900] text-white tracking-tighter uppercase italic leading-none">Journal</h2>
             {trades.length === 0 ? (
                <div className="py-40 text-center">
                  <Cpu className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">No nodes committed to ledger.</p>
                </div>
             ) : (
                trades.map(t => (
                  <div key={t.id} className="bg-[#111114] p-6 rounded-[32px] border border-white/5 flex justify-between items-center shadow-lg group hover:border-indigo-500/20 transition-all mb-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white uppercase">{t.matchName}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black ${t.side === 'BACK' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-cyan-500/10 text-cyan-400'}`}>{t.side}</span>
                        <span className="text-[9px] text-gray-500 font-mono">@{t.odds} • {t.marketLabel}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-black text-white mono">${t.stake}</span>
                    </div>
                  </div>
                ))
             )}
          </div>
        )}

        {activeTab === 'performance' && <PerformanceReview trades={trades} onAuditTrade={async () => {}} />}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-10">
             <h2 className="text-3xl font-[900] text-white tracking-tighter uppercase italic leading-none">Architect</h2>
             <div className="bg-[#111114] p-8 rounded-[40px] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1 h-6 bg-cyan-400 rounded-full" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trade Quantifier</span>
                </div>
                <div className="space-y-8">
                  <div>
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Base Stake ($)</label>
                    <input 
                      type="number" 
                      value={executionConfig.unitValue} 
                      onChange={e => setExecutionConfig(prev => ({...prev, unitValue: Number(e.target.value)}))}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-5 text-lg font-black text-white outline-none focus:border-cyan-500/50 transition-all font-mono"
                    />
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">Consensus Threshold</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(level => (
                        <button 
                          key={level}
                          onClick={() => setExecutionConfig(prev => ({...prev, minConsensusLevel: level}))}
                          className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${executionConfig.minConsensusLevel === level ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-black/40 border-white/5 text-gray-500'}`}
                        >
                          {level}/3 Experts
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/80 backdrop-blur-xl border-t border-white/5 px-10 pt-6 pb-12 flex justify-around items-center z-[2000] rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 transition-all hover:scale-110 ${activeTab === 'dashboard' ? 'text-indigo-400' : 'text-gray-700'}`}><LayoutDashboard className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('history')} className={`p-4 transition-all hover:scale-110 ${activeTab === 'history' ? 'text-cyan-400' : 'text-gray-700'}`}><HistoryIcon className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('performance')} className={`p-4 transition-all hover:scale-110 ${activeTab === 'performance' ? 'text-indigo-400' : 'text-gray-700'}`}><BarChart3 className="w-7 h-7" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-4 transition-all hover:scale-110 ${activeTab === 'settings' ? 'text-cyan-400' : 'text-gray-700'}`}><Settings className="w-7 h-7" /></button>
      </nav>
    </div>
  );
};

export default App;
