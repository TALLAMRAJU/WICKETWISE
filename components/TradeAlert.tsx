
import React from 'react';
import { X, ExternalLink, ShieldAlert, Cpu, Zap } from 'lucide-react';
import { AIEdge } from '../types';

interface TradeAlertProps {
  edge: AIEdge;
  onClose: () => void;
  onWhatsApp: () => void;
}

const TradeAlert: React.FC<TradeAlertProps> = ({ edge, onClose, onWhatsApp }) => {
  const isVariance = edge.edgeType === 'VARIANCE_PLAY';

  return (
    <div className="fixed bottom-28 left-4 right-4 z-[2002] animate-bounce-in">
      <div className={`rounded-[32px] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-start gap-5 border-2 relative overflow-hidden ${
        isVariance ? 'bg-amber-600/90 border-amber-400' : 'bg-indigo-600/90 border-indigo-400'
      } backdrop-blur-xl`}>
        <div className="absolute inset-0 scanline opacity-[0.05] pointer-events-none" />
        
        <div className="bg-white/20 p-4 rounded-3xl shadow-lg relative z-10">
          {isVariance ? <ShieldAlert className="w-8 h-8 text-white" /> : <Zap className="w-8 h-8 text-white animate-pulse" />}
        </div>
        
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-black text-sm text-white uppercase tracking-[0.2em] leading-none">
              Entropy Edge Detected
            </h4>
            <span className="bg-black/30 px-2.5 py-1 rounded-lg text-[10px] font-black mono text-white border border-white/20 leading-none">
              {edge.confidence}%
            </span>
          </div>
          <p className="text-[12px] text-white/95 font-medium leading-relaxed italic">"{edge.observation}"</p>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onWhatsApp}
              className={`flex-1 font-black text-[10px] py-4 rounded-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all border-b-4 ${
                isVariance ? 'bg-white text-amber-700 border-amber-200' : 'bg-white text-indigo-700 border-indigo-200'
              } hover:brightness-110`}
            >
              <Cpu className="w-4 h-4" /> Dispatch Bridge
            </button>
            <button 
              onClick={onClose}
              className="px-5 bg-black/30 hover:bg-black/40 rounded-2xl transition-all active:scale-90"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeAlert;
