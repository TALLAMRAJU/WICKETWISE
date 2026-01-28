
import { CricketMatch, MatchStatus, UserRule, MarketType, MarketClassification } from './types';

export const determineMarketClassification = (type: MarketType, odds: number): MarketClassification => {
  if (type === 'MATCH_WINNER') return 'APEX_STRAT';
  if (odds > 15.0 || odds < 1.01) return 'VOID_TRAP';
  return 'TACTICAL_PLAY';
};

export const INITIAL_RULES: UserRule[] = [
  {
    id: 'variance-drift-25',
    name: 'Variance Drift (>25%)',
    description: 'Detects markets where current price deviates by >25% from starting odds without a justified change in innings score/wickets.',
    isActive: true,
    minOdds: 1.1,
    maxOdds: 8.0,
    triggerLogic: 'ABS(Current - Initial) / Initial > 0.25'
  },
  {
    id: 'over-threshold-runs',
    name: 'Over-Line Compression',
    description: 'Identifies value in 10, 15, and 20 over run lines when RRR vs CRR variance reaches a structural peak.',
    isActive: true,
    minOdds: 1.8,
    maxOdds: 2.5,
    triggerLogic: 'Line Drift > 15 Runs'
  },
  {
    id: 'lay-favorite-regression',
    name: 'Mean Reversal Favorite',
    description: 'Lay favorites when they are being over-backed by market sentiment (>15% price compression) in middle overs.',
    isActive: true,
    minOdds: 1.05,
    maxOdds: 1.5
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
    venue: 'Mumbai, Wankhede',
    overs: '16.2',
    startingOddsA: 1.45, 
    startingOddsB: 2.80,
    marketLines: [
      {
        id: 'ml1_1',
        type: 'MATCH_WINNER',
        label: 'Match Winner',
        classification: 'APEX_STRAT',
        backOdds: 1.65,
        layOdds: 1.67,
        initialOdds: 1.45,
        totalMatched: 450000,
        backLiquidity: 12000,
        layLiquidity: 8500,
        lastUpdated: new Date().toISOString(),
        source: 'MOCK'
      },
      {
        id: 'ml1_10',
        type: 'OVER_RUNS_10',
        label: 'Runs at Over 10',
        classification: 'TACTICAL_PLAY',
        backOdds: 1.90,
        layOdds: 2.05,
        initialOdds: 1.85,
        lineValue: 85,
        totalMatched: 150000,
        backLiquidity: 2000,
        layLiquidity: 2000,
        lastUpdated: new Date().toISOString(),
        source: 'MOCK'
      }
    ]
  }
];
