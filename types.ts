
export enum MatchStatus {
  LIVE = 'LIVE',
  UPCOMING = 'UPCOMING',
  COMPLETED = 'COMPLETED'
}

export type MembershipTier = 'BASIC' | 'PRO';
export type MarketClassification = 'APEX_STRAT' | 'TACTICAL_PLAY' | 'VOID_TRAP';
export type MarketType = 'MATCH_WINNER' | 'INN_RUNS' | 'PP_RUNS' | 'WICKET_NEXT' | 'SESSION_RUNS';

export interface BetfairConfig {
  appKey: string;
  sessionToken: string;
  isConnected: boolean;
}

export interface PreMatchResearch {
  venueAlert: string;
  weatherImpact: string;
  keyMatchup: string;
  formTrend: string;
  strategyLead: 'COMPRESSION' | 'INFLATION' | 'MEAN_REVERSION' | 'MOMENTUM';
  battlePlanSummary: string;
}

export interface StructuralContext {
  venueBehavior: string;
  volatilityIndex: number; // 1-10
  pressureClassification: string;
  squadBalanceObservation: string;
}

export interface ExecutionConfig {
  autoTradingEnabled: boolean;
  maxExposurePerTrade: number;
  minConsensusLevel: number;
  strategyOnlyView: boolean;
  excludeAvoidMarkets: boolean;
  excludeVariancePlays: boolean;
  unitValue: number;
  dataSource: 'MOCK' | 'BETFAIR';
  allowedFormats: ('T20' | 'ODI' | 'TEST')[];
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
  baselineValue?: number;
  lastUpdated: string;
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
  startingOddsA: number;
  startingOddsB: number;
  marketLines: MarketLine[];
  context?: StructuralContext;
  research?: PreMatchResearch;
  advisesUsed: number;
  isLiveBetfair?: boolean;
}

export interface AIEdge {
  matchId: string;
  marketId: string;
  edgeType: 'INFLATION' | 'COMPRESSION' | 'VARIANCE_PLAY';
  confidence: number;
  observation: string;
  structuralReasoning: string[];
  isLocked: boolean;
  isHeavy?: boolean;
  recommendation?: string;
  reasoning?: string;
  timestamp?: string;
}

export interface TradeLog {
  id: string;
  matchId: string;
  matchName: string;
  marketLabel: string;
  side: 'BACK' | 'LAY';
  odds: number;
  units: 0.5 | 1.0 | 1.5;
  stake: number;
  ruleId: string;
  status: 'OPEN' | 'WON' | 'LOST' | 'MATCHED' | 'EXECUTING' | 'FAILED';
  timestamp: string;
  explanation?: string;
}

export interface UserRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  minOdds?: number;
  maxOdds?: number;
}
