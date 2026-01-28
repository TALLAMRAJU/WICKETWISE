
import { CricketMatch, MarketLine } from "../types";
import { MOCK_MATCHES } from "../constants";
import { BetfairService } from "./betfairService";
import { JeebetService } from "./jeebetService";

export class CricketDataService {
  private betfair: BetfairService | null = null;
  private jeebet: JeebetService | null = null;

  setBetfairCredentials(appKey: string, sessionToken: string, proxyUrl?: string) {
    this.betfair = new BetfairService(appKey, sessionToken, proxyUrl);
  }

  setJeebetCredentials(username: string, sessionCookie: string) {
    this.jeebet = new JeebetService(username, sessionCookie);
  }

  async getAggregatedLiveMatches(): Promise<CricketMatch[]> {
    const results: CricketMatch[] = [];
    
    // Attempt Betfair Fetch
    if (this.betfair) {
      try {
        const bfMatches = await this.betfair.fetchLiveMatches();
        results.push(...bfMatches);
      } catch (e) { console.error("BF Sync Failed", e); }
    }

    // Attempt Jeebet Fetch
    if (this.jeebet) {
      try {
        const jbMatches = await this.jeebet.fetchJeebetMarkets();
        results.push(...jbMatches);
      } catch (e) { console.error("JB Sync Failed", e); }
    }

    // Fallback to Mock if nothing connected
    if (results.length === 0) {
      return MOCK_MATCHES;
    }

    return results;
  }
}
