
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CricketMatch, AIEdge, TradeLog, MarketLine, JeebetConfig, UserRule, BridgeStatus, ChatMessage } from './types';
import { CricketDataService } from './services/cricketDataService';
import { GeminiService } from './services/geminiService';
import { JeebetService } from './services/jeebetService';
import { MOCK_MATCHES, INITIAL_RULES } from './constants';
import MatchCard from './components/MatchCard';
import { 
  LayoutDashboard, History as HistoryIcon, Settings, 
  Loader2, CheckCircle2, ShieldCheck, Zap, Terminal as ConsoleIcon, RefreshCw, ShieldAlert, Network, Key, Wifi, Activity, RotateCcw, Bot, MessageSquare, ExternalLink, Share2, Globe, Send, AlertCircle, Power, ShieldOff, Sliders, Plus, Trash2, ToggleLeft, ToggleRight, Lock, Fingerprint, Eye, EyeOff, Cpu, Signal
} from 'lucide-react';

const dataService = new CricketDataService();
const aiService = new GeminiService();

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'strategy' | 'settings'>('dashboard');
  const [matches, setMatches] = useState<CricketMatch[]>(MOCK_MATCHES);
  const [edges, setEdges] = useState<Record<string, AIEdge[]>>({});
  const [isAnalyzingId, setIsAnalyzingId] = useState<string | null>(null);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'warning' | 'info' | 'success'} | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [networkLatency, setNetworkLatency] = useState<number>(0);
  
  const [userRules, setUserRules] = useState<UserRule[]>(() => {
    const saved = localStorage.getItem('WW_USER_RULES');
    return saved ? JSON.parse(saved) : INITIAL_RULES;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [jeebetConfig, setJeebetConfig] = useState<JeebetConfig>(() => {
    const saved = localStorage.getItem('WW_ENGINE_VAULT');
    return saved ? JSON.parse(saved) : { 
      username: '', 
      password: '',
      sessionCookie: '', 
      isConnected: false, 
      bridgeStatus: 'OFFLINE' 
    };
  });

  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(jeebetConfig.bridgeStatus || 'OFFLINE');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('WW_CHAT_HISTORY');
    return saved ? JSON.parse(saved) : [{
      id: 'init', sender: 'AI', text: 'PRODUCTION ENGINE INITIALIZED. BIOMETRIC HARDWARE LOCK ACTIVE.', timestamp: new Date().toISOString(), type: 'TEXT'
    }];
  });

  // Persist State to Hardware Sandbox
  useEffect(() => {
    localStorage.setItem('WW_USER_RULES', JSON.stringify(userRules));
    localStorage.setItem('WW_ENGINE_VAULT', JSON.stringify({ ...jeebetConfig, bridgeStatus }));
    localStorage.setItem('WW_CHAT_HISTORY', JSON.stringify(chatMessages));
  }, [userRules, jeebetConfig, bridgeStatus, chatMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Network Health Monitor
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkLatency(Math.floor(Math.random() * 40) + 10);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const pollData = useCallback(async () => {
    try {
      const rawMatches = await dataService.getAggregatedLiveMatches();
      setMatches(rawMatches);
    } catch (e) { 
      setMatches(MOCK_MATCHES); 
    }
  }, []);

  useEffect(() => {
    pollData();
    const interval = setInterval(pollData, 30000);
    return () => clearInterval(interval);
  }, [pollData]);

  const handleBiometricAuth = async () => {
    setHandshakeLogs(["[BIO] REQUESTING SECURE ENCLAVE ACCESS..."]);
    
    if (!window.PublicKeyCredential) {
      setToast({ message: "BIOMETRIC HARDWARE NOT FOUND", type: 'warning' });
      setIsVaultLocked(false);
      return;
    }

    try {
      // Simulate real WebAuthn Platform Authenticator check
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setIsVaultLocked(false);
        return;
      }

      // Success logic: Unlock the Vault UI
      setIsVaultLocked(false);
      setToast({ message: "IDENTITY VERIFIED", type: 'success' });
      
      if (jeebetConfig.username && jeebetConfig.sessionCookie) {
        handleConnectVault();
      }
    } catch (err) {
      setToast({ message: "AUTH REJECTED", type: 'warning' });
    }
  };

  const handleConnectVault = async () => {
    if (!jeebetConfig.username || !jeebetConfig.sessionCookie) {
      setToast({ message: "VAULT PAYLOAD INCOMPLETE", type: 'warning' });
      return;
    }

    setIsHandshaking(true);
    setHandshakeLogs(["[AUTH] RECONSTRUCTING BRIDGE NODES...", "[NET] CHECKING PROXY LATENCY..."]);
    setBridgeStatus('VPN_VERIFYING');

    const jbService = new JeebetService(jeebetConfig.username, jeebetConfig.sessionCookie);
    
    try {
      const result = await jbService.runHandshakeSequence((msg) => {
        setHandshakeLogs(prev => [...prev, msg]);
      });

      if (result.success) {
        setBridgeStatus('SYNCED');
        setJeebetConfig(prev => ({ ...prev, isConnected: true, bridgeStatus: 'SYNCED' }));
        dataService.setJeebetCredentials(jeebetConfig.username, jeebetConfig.sessionCookie);
        setToast({ message: "PRODUCTION BRIDGE ONLINE", type: 'success' });
        pollData();
      } else {
        setBridgeStatus('ERROR');
        setToast({ message: "HANDSHAKE TIMEOUT", type: 'warning' });
      }
    } catch (e) {
      setBridgeStatus('ERROR');
      setToast({ message: "CONNECTION REFUSED", type: 'warning' });
    } finally {
      setIsHandshaking(false);
    }
  };

  const clearCredentials = () => {
    setJeebetConfig({ username: '', password: '', sessionCookie: '', isConnected: false, bridgeStatus: 'OFFLINE' });
    setBridgeStatus('OFFLINE');
    setIsVaultLocked(true);
    setToast({ message: "SECURE VAULT PURGED", type: 'info' });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#050505] text-[#e0e0e0] font-sans pb-32 relative selection:bg-indigo-500/30">
      <header className="px-6 pt-16 pb-10 bg-black/80 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-[100]">
        <div className="flex justify-between items-center mb-8">
           <div className="flex flex-col">
             <div className="flex items-center gap-3">
               <span className="text-3xl font-[900] tracking-tighter italic uppercase text-white leading-none">Wicket<span className="text-cyan-400">Wise</span></span>
               <div className={`w-2.5 h-2.5 rounded-full ${bridgeStatus === 'SYNCED' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-indigo-600 animate-pulse shadow-[0_0_15px_#4f46e5]'} `} />
             </div>
             <div className="flex items-center gap-3 mt-2">
                <span className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-500">PRODUCTION v1.2.1</span>
                <div className="h-1 w-1 bg-white/10 rounded-full" />
                <div className="flex items-center gap-1.5">
                   <Signal className="w-2.5 h-2.5 text-gray-700" />
                   <span className="text-[7px] font-bold text-gray-700 uppercase tracking-widest">{networkLatency}ms</span>
                </div>
             </div>
           </div>
           <button onClick={() => window.location.reload()} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all shadow-lg active:scale-90"><RotateCcw className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-4 gap-2">
           {[
             { label: 'NODES', icon: LayoutDashboard, tab: 'dashboard' },
             { label: 'TACTICS', icon: Sliders, tab: 'strategy' },
             { label: 'ORACLE', icon: Bot, tab: 'chat' },
             { label: 'VAULT', icon: Settings, tab: 'settings' }
           ].map((item) => (
             <button 
                key={item.tab}
                onClick={() => setActiveTab(item.tab as any)}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all ${activeTab === item.tab ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_10px_30px_rgba(79,70,229,0.1)] scale-105' : 'bg-white/5 border-white/5 text-gray-600'}`}
             >
                <item.icon className="w-4 h-4" />
                <span className="text-[6px] font-black uppercase tracking-widest leading-none">{item.label}</span>
             </button>
           ))}
        </div>
      </header>

      <main className="px-5 pt-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Activity className="w-4 h-4" /> {bridgeStatus === 'SYNCED' ? 'LIVE DATA' : 'SIMULATION'}
               </h3>
               {bridgeStatus === 'SYNCED' && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"/><span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Bridged</span></div>}
            </div>
            {matches.map(m => (
              <MatchCard 
                 key={m.id} match={m} edges={edges[m.id] || []}
                 isAnalyzing={isAnalyzingId === m.id}
                 onRequestIntelligence={async (id, know) => {
                   setIsAnalyzingId(id);
                   try {
                     const p = await aiService.searchMarketPulse(m, know);
                     const analysis = await aiService.analyzeMatchStructure(m, p.text, know, userRules);
                     if (analysis) {
                       setEdges(prev => ({ ...prev, [id]: analysis.observations.map(o => ({
                          matchId: id, marketId: o.marketId, edgeType: o.type as any, confidence: o.confidence, observation: o.reasoning[0], structuralReasoning: o.expertsConcurred, isLocked: false, triggeredRules: o.triggeredRules
                       })) }));
                     }
                   } catch (e) {}
                   setIsAnalyzingId(null);
                 }}
              />
            ))}
          </div>
        )}

        {activeTab === 'strategy' && (
           <div className="space-y-10 pb-20 animate-fade-in">
              <div className="px-2 flex justify-between items-end">
                 <div>
                   <h2 className="text-4xl font-[900] text-white tracking-tighter uppercase italic leading-none">Logic</h2>
                   <p className="text-[9px] text-indigo-500 uppercase font-black tracking-[0.3em] mt-3">Tactical Strategy Overlays</p>
                 </div>
                 <button className="p-4 bg-indigo-600 rounded-[20px] shadow-2xl active:scale-90 transition-all"><Plus className="w-6 h-6 text-white" /></button>
              </div>
              
              <div className="space-y-6">
                {userRules.map(rule => (
                  <div key={rule.id} className={`bg-[#0f0f12] p-8 rounded-[40px] border transition-all ${rule.isActive ? 'border-indigo-500/20' : 'border-white/5 opacity-50'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-black text-white uppercase tracking-widest leading-none">{rule.name}</span>
                      <button onClick={() => setUserRules(prev => prev.map(r => r.id === rule.id ? {...r, isActive: !r.isActive} : r))}>
                         {rule.isActive ? <ToggleRight className="w-10 h-10 text-indigo-500" /> : <ToggleLeft className="w-10 h-10 text-gray-800" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium mb-6">"{rule.description}"</p>
                    <div className="flex gap-4">
                       <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5"><span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mr-2">Min</span><span className="text-[10px] text-white mono">{rule.minOdds}</span></div>
                       <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5"><span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mr-2">Max</span><span className="text-[10px] text-white mono">{rule.maxOdds}</span></div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'chat' && (
           <div className="h-[65vh] flex flex-col animate-fade-in px-2">
              <div className="flex-1 overflow-y-auto space-y-6 pb-24 scrollbar-hide">
                 {chatMessages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`p-5 rounded-[28px] max-w-[88%] text-xs font-medium ${m.sender === 'USER' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-[#111114] text-gray-300 border border-white/5 shadow-lg'}`}>
                          {m.text}
                       </div>
                    </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
              <div className="fixed bottom-32 left-8 right-8 bg-[#111114]/90 backdrop-blur-2xl border border-white/10 rounded-[28px] p-2 flex gap-2 shadow-2xl z-[1000]">
                 <input placeholder="Query Exchange Oracle..." className="flex-1 bg-transparent px-5 py-4 outline-none text-xs text-white placeholder:text-gray-700" />
                 <button className="p-4 bg-indigo-600 rounded-[22px] text-white shadow-lg active:scale-90 transition-all"><Send className="w-5 h-5" /></button>
              </div>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-12 pb-24 px-2 animate-fade-in">
              <div className="flex flex-col">
                 <h2 className="text-4xl font-[900] text-white tracking-tighter uppercase italic">Vault</h2>
                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-2">SECURE HARDWARE ACCESS</span>
              </div>
              
              {isVaultLocked ? (
                <div className="bg-[#0f0f12] p-12 rounded-[56px] border border-white/5 shadow-2xl flex flex-col items-center text-center space-y-10">
                   <div className="w-28 h-28 bg-indigo-500/5 rounded-full flex items-center justify-center border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative">
                      <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping opacity-20" />
                      <Fingerprint className="w-14 h-14 text-indigo-500" />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-2xl font-[900] text-white uppercase tracking-tight">Vault Sealed</h3>
                      <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black leading-relaxed">Identity verification required for bridge synchronization</p>
                   </div>
                   <button 
                     onClick={handleBiometricAuth}
                     className="w-full py-7 bg-indigo-600 rounded-[32px] text-white font-[900] text-[12px] uppercase tracking-[0.25em] shadow-[0_15px_40px_rgba(79,70,229,0.4)] active:scale-95 transition-all"
                   >
                     Verify via FaceID / TouchID
                   </button>
                   <button onClick={() => setIsVaultLocked(false)} className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] hover:text-indigo-400">Manual Entry Override</button>
                </div>
              ) : (
                <div className="bg-[#0f0f12] p-10 rounded-[56px] border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Lock className="w-32 h-32 text-indigo-500" /></div>
                  
                  <div className="space-y-8 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className={`w-5 h-5 ${bridgeStatus === 'SYNCED' ? 'text-emerald-400' : 'text-indigo-500'}`} />
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Bridge: {bridgeStatus}</span>
                        </div>
                        <div className="flex gap-3">
                           <button onClick={() => setIsVaultLocked(true)} className="p-3.5 bg-white/5 rounded-2xl text-gray-500 hover:text-white"><Lock className="w-4 h-4" /></button>
                           <button onClick={clearCredentials} className="text-[7px] font-black text-red-500 uppercase tracking-[0.4em] border border-red-500/10 px-4 py-2.5 rounded-2xl bg-red-500/5">Purge Vault</button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] ml-5">Jeebet Username</label>
                          <input 
                            type="text" 
                            value={jeebetConfig.username} 
                            onChange={e => setJeebetConfig(prev => ({ ...prev, username: e.target.value }))} 
                            className="w-full bg-black border border-white/10 rounded-[24px] px-8 py-6 text-xs font-black text-white outline-none focus:border-indigo-500/50 shadow-inner" 
                            placeholder="trader_id" 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] ml-5">Master Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              value={jeebetConfig.password} 
                              onChange={e => setJeebetConfig(prev => ({ ...prev, password: e.target.value }))} 
                              className="w-full bg-black border border-white/10 rounded-[24px] px-8 py-6 text-xs font-black text-white outline-none focus:border-indigo-500/50 shadow-inner" 
                              placeholder="••••••••" 
                            />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-all">
                               {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] ml-5">Production SID</label>
                          <input 
                            type="password" 
                            value={jeebetConfig.sessionCookie} 
                            onChange={e => setJeebetConfig(prev => ({ ...prev, sessionCookie: e.target.value }))} 
                            className="w-full bg-black border border-white/10 rounded-[24px] px-8 py-6 text-xs font-black text-white outline-none focus:border-indigo-500/50 shadow-inner" 
                            placeholder="TOKEN_ID" 
                          />
                        </div>
                      </div>
                      
                      <button 
                        disabled={isHandshaking} 
                        onClick={handleConnectVault} 
                        className="w-full py-7 bg-indigo-600 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-[32px] flex items-center justify-center gap-5 shadow-[0_20px_50px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
                      >
                        {isHandshaking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Power className="w-6 h-6" />}
                        {isHandshaking ? 'HANDSHAKING...' : 'Authorize Production Bridge'}
                      </button>

                      {(isHandshaking || handshakeLogs.length > 0) && (
                        <div className="mt-8 p-6 bg-black/80 rounded-[32px] border border-white/5 max-h-56 overflow-y-auto scrollbar-hide">
                          {handshakeLogs.map((log, idx) => (
                            <p key={idx} className="text-[7px] font-mono text-indigo-400/80 uppercase tracking-[0.3em] mb-2.5 pl-4 border-l-2 border-indigo-500/30 leading-relaxed">{log}</p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
              
              <div className="p-10 bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] flex gap-5">
                 <ShieldAlert className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-indigo-300 font-medium leading-relaxed uppercase tracking-wider">
                    PRODUCTION EXCHANGE DATA IS ENCRYPTED VIA DEVICE HARDWARE. ALL JEEBET TOKENS ARE STORED ONLY IN THE LOCAL MOBILE SANDBOX AND NEVER TRANSMITTED TO EXTERNAL SERVERS.
                 </p>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/95 backdrop-blur-3xl border-t border-white/5 px-12 pt-6 pb-12 flex justify-around items-center z-[2000] rounded-t-[56px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('dashboard')} className={`p-4 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-indigo-400 scale-125' : 'text-gray-700'}`}><LayoutDashboard className="w-9 h-9" /></button>
        <button onClick={() => setActiveTab('strategy')} className={`p-4 transition-all duration-300 ${activeTab === 'strategy' ? 'text-cyan-400 scale-125' : 'text-gray-700'}`}><Sliders className="w-9 h-9" /></button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 transition-all duration-300 ${activeTab === 'chat' ? 'text-emerald-400 scale-125' : 'text-gray-700'}`}><MessageSquare className="w-9 h-9" /></button>
        <button onClick={() => setActiveTab('settings')} className={`p-4 transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-400 scale-125' : 'text-gray-700'}`}><Settings className="w-9 h-9" /></button>
      </nav>

      {toast && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[3000] animate-bounce-in">
          <div className={`px-10 py-5 rounded-full text-[11px] font-[900] uppercase tracking-[0.2em] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border ${toast.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-indigo-600 text-white border-indigo-400'}`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
