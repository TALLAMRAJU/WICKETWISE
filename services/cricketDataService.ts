
import { CricketMatch } from "../types";
import { MOCK_MATCHES } from "../constants";
import { BetfairService } from "./betfairService";

export class CricketDataService {
  private oversCache: Record<string, number> = {};
  private betfair: BetfairService | null = null;

  setBetfairCredentials(appKey: string, sessionToken: string) {
    this.betfair = new BetfairService(appKey, sessionToken);
  }

  async getLiveMatches(useBetfair: boolean = false): Promise<CricketMatch[]> {
    if (useBetfair && this.betfair) {
      try {
        return await this.betfair.fetchLiveMatches();
      } catch (e) {
        console.warn("Falling back to MOCK data due to Betfair error");
      }
    }

    // Fallback Mock Logic
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const possibleBalls = ['0', '1', '2', '4', '6', 'W', '1', '0', '1'];

    return MOCK_MATCHES.map(match => {
      // Simulate over progression
      if (!this.oversCache[match.id]) {
        this.oversCache[match.id] = parseFloat(match.overs);
      } else {
        this.oversCache[match.id] = Number((this.oversCache[match.id] + 0.05).toFixed(1));
        if (this.oversCache[match.id] % 1 >= 0.6) {
           this.oversCache[match.id] = Math.floor(this.oversCache[match.id]) + 1;
        }
      }
      
      return {
        ...match,
        overs: this.oversCache[match.id].toString(),
        advisesUsed: 0,
        isLiveBetfair: false,
        marketLines: match.marketLines.map(line => {
          const shift = (Math.random() - 0.5) * 0.05;
          const matchedShift = Math.floor(Math.random() * 5000);
          
          return {
            ...line,
            backOdds: Number((line.backOdds + shift).toFixed(2)),
            layOdds: Number((line.backOdds + shift + 0.02).toFixed(2)),
            totalMatched: line.totalMatched + matchedShift,
            backLiquidity: Math.max(500, line.backLiquidity + (Math.random() - 0.5) * 1000),
            layLiquidity: Math.max(500, line.layLiquidity + (Math.random() - 0.5) * 1000)
          };
        })
      };
    });
  }
}
