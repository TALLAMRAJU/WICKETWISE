
import React, { useState } from 'react';
import { TradeLog } from '../types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  PieChart, 
  Target, 
  Activity, 
  ShieldCheck,
  BrainCircuit,
  Loader2,
  BarChart as BarChartIcon,
  Search,
  Dna
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface PerformanceReviewProps {
  trades: TradeLog[];
  onAuditTrade: (tradeId: string) => Promise<void>;
}

const PerformanceReview: React.FC<PerformanceReviewProps> = ({ trades, onAuditTrade }) => {
  const settledTrades = trades.filter(t => t.status === 'WON' || t.status === 'LOST');
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  
  const totalStaked = settledTrades.reduce((acc, t) => acc + t.stake, 0);
  const totalProfit = settledTrades.reduce((acc, t) => {
    if (t.status === 'WON') {
      return acc + (t.stake * (t.odds - 1));
    } else {
      return acc - t.stake;
    }
  }, 0);

  const averageStake = settledTrades.length > 0 ? (totalStaked / settledTrades.length) : 0;
  const maxStake = settledTrades.length > 0 ? Math.max(...settledTrades.map(t => t.stake)) : 0;

  const winCount = settledTrades.filter(t => t.status === 'WON').length;
  const winRate = settledTrades.length > 0 ? (winCount / settledTrades.length * 100).toFixed(1) : '0';
  const roi = totalStaked > 0 ? ((totalProfit / totalStaked) * 100).toFixed(1) : '0';

  const handleAudit = async (id: string) => {
    setAuditingIds(prev => new Set(prev).add(id));
    try {
      await onAuditTrade(id);
    } finally {
      setAuditingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const stakedWon = settledTrades.filter(t => t.status === 'WON').reduce((acc, t) => acc + t.stake, 0);
  const stakedLost = settledTrades.filter(t => t.status === 'LOST').reduce((acc, t) => acc + t.stake, 0);

  const chartData = [
    { name: 'WON', stake: stakedWon, color: '#10b981' },
    { name: 'LOST', stake: stakedLost, color: '#ef4444' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">{payload[0].payload.name}</p>
          <p className="text-xl font-[900] text-white mono">
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="px-2">
        <h2 className="text-3xl font-[900] text-white tracking-tighter uppercase leading-none">Intelligence Audit</h2>
        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Historical Convergence Ledger</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mx-2">
         <div className="bg-[#111114] p-5 rounded-[28px] border border-white/5 shadow-xl group hover:border-indigo-500/20 transition-all">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-2">Total Staked</span>
            <span className="text-sm font-[900] text-white mono">${totalStaked.toLocaleString()}</span>
         </div>
         <div className="bg-[#111114] p-5 rounded-[28px] border border-white/5 shadow-xl group hover:border-indigo-500/20 transition-all">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-2">Mean Exposure</span>
            <span className="text-sm font-[900] text-indigo-400 mono">${averageStake.toFixed(0)}</span>
         </div>
         <div className="bg-[#111114] p-5 rounded-[28px] border border-white/5 shadow-xl group hover:border-indigo-500/20 transition-all">
            <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest block mb-2">Peak Exposure</span>
            <span className="text-sm font-[900] text-amber-500 mono">${maxStake.toLocaleString()}</span>
         </div>
      </div>
      
      <div className="bg-[#111114] border border-white/5 rounded-[40px] overflow-hidden mx-2 shadow-2xl relative">
        <div className="absolute inset-0 scanline opacity-[0.01] pointer-events-none" />
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-indigo-500/10 to-transparent">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Yield Delta</span>
                <h3 className="text-2xl font-[900] mono text-white">{winRate}% <span className="text-[10px] text-gray-600 font-medium tracking-widest">ACCURACY</span></h3>
              </div>
           </div>
           <div className="text-right">
              <span className={`text-xs font-black font-mono px-4 py-2 rounded-2xl border ${Number(roi) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                {roi}% ROI
              </span>
           </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/5">
           <div className="p-7 flex flex-col">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" /> Net P/L
              </span>
              <span className={`text-2xl font-[900] mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString()}
              </span>
           </div>
           <div className="p-7 flex flex-col">
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4" /> NODES
              </span>
              <span className="text-2xl font-[900] mono text-indigo-400">
                {settledTrades.length} <span className="text-[10px] text-gray-600 font-medium">EVENTS</span>
              </span>
           </div>
        </div>
      </div>

      <div className="bg-[#111114] p-8 rounded-[40px] border border-white/5 mx-2 shadow-2xl relative">
        <div className="absolute inset-0 scanline opacity-[0.01] pointer-events-none" />
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <BarChartIcon className="w-5 h-5 text-cyan-400" />
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">Capital Weighting Analysis</span>
           </div>
        </div>
        
        <div className="h-56 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }} 
                   dy={15}
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }} 
                 />
                 <Tooltip content={<CustomTooltip />} cursor={{ fill: 'white', fillOpacity: 0.03 }} />
                 <Bar dataKey="stake" radius={[12, 12, 0, 0]} barSize={60}>
                    {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />
                    ))}
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-3">
             <Activity className="w-5 h-5" /> Neural Audit Stream
          </h3>
        </div>
        
        {settledTrades.length === 0 ? (
          <div className="text-center py-20 opacity-10 flex flex-col items-center">
             <Clock className="w-16 h-16 mb-6" />
             <p className="text-[11px] font-black uppercase tracking-[0.3em]">Zero-Entropy State</p>
          </div>
        ) : (
          settledTrades.map(trade => (
            <div key={trade.id} className="bg-[#111114] rounded-[40px] overflow-hidden border border-white/5 mx-2 shadow-xl transition-all hover:border-indigo-500/30 group">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-[900] text-white tracking-tight leading-none mb-2 uppercase">{trade.matchName}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{trade.marketLabel}</span>
                      <div className="h-1 w-1 bg-white/10 rounded-full" />
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest mono">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl shadow-lg border ${trade.status === 'WON' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    {trade.status === 'WON' ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8 bg-black/30 p-5 rounded-[24px] border border-white/5 shadow-inner">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Geometric</span>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${trade.side === 'BACK' ? 'text-indigo-400' : 'text-cyan-400'}`}>{trade.side}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Price</span>
                    <span className="text-[11px] font-black text-white font-mono leading-none">@{trade.odds}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Outcome</span>
                    <span className={`text-[11px] font-black font-mono leading-none ${trade.status === 'WON' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.status === 'WON' ? `+$${(trade.stake * (trade.odds - 1)).toFixed(0)}` : `-$${trade.stake.toFixed(0)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">State</span>
                    <Dna className={`w-4 h-4 mt-0.5 ${trade.explanation ? 'text-indigo-500 animate-pulse' : 'text-gray-800'}`} />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <Search className="w-4 h-4 text-indigo-500" />
                     <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em]">Predictive Post-Mortem</span>
                  </div>
                  
                  {trade.explanation ? (
                    <div className="bg-black/50 p-6 rounded-[28px] border border-white/5 italic relative shadow-inner overflow-hidden">
                      <div className="absolute inset-0 scanline opacity-[0.01] pointer-events-none" />
                      <p className="text-xs text-gray-400 leading-relaxed font-mono relative z-10">
                        {trade.explanation}
                      </p>
                    </div>
                  ) : (
                    <button 
                      disabled={auditingIds.has(trade.id)}
                      onClick={() => handleAudit(trade.id)}
                      className="w-full py-5 bg-indigo-600/10 border border-indigo-500/30 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center justify-center gap-3 hover:bg-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {auditingIds.has(trade.id) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <BrainCircuit className="w-5 h-5" />
                      )}
                      {auditingIds.has(trade.id) ? 'Calculating...' : 'Execute Structural Audit'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PerformanceReview;
