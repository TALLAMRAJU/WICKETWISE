
import { CricketMatch, MatchStatus, UserRule, MarketType, MarketClassification } from './types';

/**
 * Intelligent Market Classifier
 * 
 * APEX_STRAT: Core liquidity markets (Match Odds)
 * TACTICAL_PLAY: High-volume structural markets (Innings Runs)
 * VOID_TRAP: Extreme longshots, illiquid lines, or high-variance traps
 */
export const determineMarketClassification = (type: MarketType, odds: number): MarketClassification => {
  if (type === 'MATCH_WINNER') return 'APEX_STRAT';
  
  // Discipline Rule: Avoid extreme variance or low-probability "lotto" lines
  if (odds > 12.0 || odds < 1.02) return 'VOID_TRAP';
  
  // Innings and Session markets are strategic secondary layers
  if (type === 'INN_RUNS' || type === 'SESSION_RUNS' || type === 'PP_RUNS') return 'TACTICAL_PLAY';
  
  return 'VOID_TRAP';
};

export const INITIAL_RULES: UserRule[] = [
  {
    id: 'mean-reversal-extreme',
    name: 'Mean Reversal Extremes',
    description: 'Detects aggressive market line stretching (e.g. ODI scores >380 or T20 >230) where statistical mean reversal probability is high despite match context.',
    isActive: true,
    minOdds: 1.05,
    maxOdds: 10.0
  },
  {
    id: 'lay-the-favorite-pp',
    name: 'Betfair Lay-the-Favorite',
    description: 'Lay the favorite if they are chasing and the RRR climbs > 10.5 in middle overs.',
    isActive: true,
    minOdds: 1.1,
    maxOdds: 1.6
  },
  {
    id: 'volume-spike-wickets',
    name: 'Liquidity Momentum Check',
    description: 'Back the bowling side if a massive volume spike occurs before a ball is bowled.',
    isActive: true,
    minOdds: 1.8,
    maxOdds: 3.5
  },
  {
    id: 'variance-drift-back',
    name: 'Discipline: Variance Play',
    description: 'Alert if current odds drift > 20% from SP despite no major wicket loss.',
    isActive: true,
    minOdds: 1.5,
    maxOdds: 5.0
  }
];

export const MOCK_MATCHES: CricketMatch[] = [
  {
    id: 'm1',
    teamA: 'India',
    teamB: 'Australia',
    scoreA: '145/4',
    scoreB: 'Yet to bat',
    status: MatchStatus.LIVE,
    format: 'T20',
    venue: 'Mumbai',
    overs: '16.2',
    startingOddsA: 1.45, 
    startingOddsB: 2.80,
    advisesUsed: 0,
    marketLines: [
      {
        id: 'ml1_1',
        type: 'MATCH_WINNER',
        label: 'Match Winner',
        classification: determineMarketClassification('MATCH_WINNER', 1.65),
        backOdds: 1.65,
        layOdds: 1.67,
        totalMatched: 450000,
        backLiquidity: 12000,
        layLiquidity: 8500,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'ml1_2',
        type: 'INN_RUNS',
        label: 'Total Runs (Innings 1)',
        classification: determineMarketClassification('INN_RUNS', 1.95),
        lineValue: 245,
        backOdds: 1.95,
        layOdds: 2.05,
        totalMatched: 120000,
        backLiquidity: 5000,
        layLiquidity: 4500,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'ml1_3',
        type: 'WICKET_NEXT',
        label: 'Next Wicket Over 17.5',
        classification: determineMarketClassification('WICKET_NEXT', 15.5), // High odds -> VOID_TRAP
        backOdds: 15.5,
        layOdds: 16.5,
        totalMatched: 1500,
        backLiquidity: 200,
        layLiquidity: 150,
        lastUpdated: new Date().toISOString()
      }
    ]
  },
  {
    id: 'm2',
    teamA: 'England',
    teamB: 'South Africa',
    scoreA: '280/8',
    scoreB: '150/2',
    status: MatchStatus.LIVE,
    format: 'ODI',
    venue: 'London',
    overs: '25.0',
    startingOddsA: 1.90, 
    startingOddsB: 1.90,
    advisesUsed: 0,
    marketLines: [
      {
        id: 'ml2_1',
        type: 'MATCH_WINNER',
        label: 'Match Winner',
        classification: determineMarketClassification('MATCH_WINNER', 3.10),
        backOdds: 3.10,
        layOdds: 3.15,
        totalMatched: 890000,
        backLiquidity: 25000,
        layLiquidity: 30000,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'ml2_2',
        type: 'INN_RUNS',
        label: 'Total Runs (Innings 1)',
        classification: determineMarketClassification('INN_RUNS', 1.80),
        lineValue: 410,
        backOdds: 1.80,
        layOdds: 1.85,
        totalMatched: 340000,
        backLiquidity: 15000,
        layLiquidity: 12000,
        lastUpdated: new Date().toISOString()
      }
    ]
  }
];
