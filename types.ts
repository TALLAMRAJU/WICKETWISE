
export enum MatchStatus {
  LIVE = 'LIVE',
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED'
}

export type BridgeStatus = 'OFFLINE' | 'VPN_VERIFYING' | 'AUTH_PENDING' | 'SYNCED' | 'RECON_ACTIVE' | 'ERROR';

export type MarketClassification = 'APEX_STRAT' | 'TACTICAL_PLAY' | 'VOID_TRAP';
export type MarketType = 
  | 'MATCH_WINNER' 
  | 'INN_RUNS' 
  | 'PP_RUNS' 
  | 'WICKET_NEXT' 
  | 'SESSION_RUNS'
  | 'OVER_RUNS_4' 
  | 'OVER_RUNS_6' 
  | 'OVER_RUNS_10' 
  | 'OVER_RUNS_15' 
  | 'OVER_RUNS_20' 
  | 'OVER_RUNS_25' 
  | 'OVER_RUNS_30' 
  | 'OVER_RUNS_40' 
  | 'OVER_RUNS_50';

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  type: 'TEXT' | 'SIGNAL' | 'STATUS';
  payload?: any;
}

export interface StructuralContext {
  venueBehavior: string;
  volatilityIndex: number;
  pressureClassification: string;
  squadBalanceObservation: string;
}

export interface UserRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  minOdds: number;
  maxOdds: number;
  triggerLogic?: string;
}

export interface JeebetConfig {
  username: string;
  password?: string;
  sessionCookie: string;
  isConnected: boolean;
  bridgeStatus: BridgeStatus;
}

export interface MarketLine {
  id: string;
  type: MarketType;
  label: string;
  classification: MarketClassification;
  lineValue?: number;
  backOdds: number;
  layOdds: number;
  totalMatched: number;
  backLiquidity: number;
  layLiquidity: number;
  lastUpdated: string;
  source: 'BETFAIR' | 'JEEBET' | 'MOCK' | 'LIVE_EXCHANGE';
  initialOdds?: number; // Starting odds for variance tracking
}

export interface CricketMatch {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  status: MatchStatus;
  format: 'T20' | 'ODI' | 'TEST';
  venue: string;
  overs: string;
  marketLines: MarketLine[];
  isLiveRealtime?: boolean;
  startingOddsA?: number;
  startingOddsB?: number;
  advisesUsed?: number;
}

export interface AIEdge {
  matchId: string;
  marketId: string;
  edgeType: 'INFLATION' | 'COMPRESSION' | 'VARIANCE_PLAY';
  confidence: number;
  observation: string;
  structuralReasoning: string[];
  isLocked: boolean;
  triggeredRules?: string[];
}

export interface TradeLog {
  id: string;
  matchId: string;
  matchName: string;
  marketLabel: string;
  side: 'BACK' | 'LAY';
  odds: number;
  stake: number;
  status: 'WON' | 'LOST' | 'MATCHED';
  timestamp: string;
  sourceNode: string;
  explanation?: string;
}
