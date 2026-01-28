
import { CricketMatch, MarketLine, MatchStatus, MarketType } from "../types";
import { determineMarketClassification } from "../constants";

const BETFAIR_API_ENDPOINT = 'https://api.betfair.com/exchange/betting/rest/v1.0';

export class BetfairService {
  private appKey: string = '';
  private sessionToken: string = '';

  constructor(appKey?: string, sessionToken?: string) {
    this.appKey = appKey || '';
    this.sessionToken = sessionToken || '';
  }

  private async request(method: string, params: any) {
    if (!this.appKey || !this.sessionToken) {
        throw new Error("Betfair credentials missing");
    }

    const response = await fetch(`${BETFAIR_API_ENDPOINT}/${method}/`, {
      method: 'POST',
      headers: {
        'X-Application': this.appKey,
        'X-Authentication': this.sessionToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Betfair API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async listLiveCricketEvents(): Promise<any[]> {
    const filter = {
      eventTypeIds: ['4'], // Cricket
      inPlayOnly: true
    };
    return this.request('listEvents', { filter });
  }

  async getMarketCatalogue(eventIds: string[]): Promise<any[]> {
    const filter = {
      eventIds,
      marketTypeCodes: ['MATCH_ODDS', 'INNINGS_RUNS']
    };
    return this.request('listMarketCatalogue', {
      filter,
      maxResults: 50,
      marketProjection: ['EVENT', 'MARKET_START_TIME', 'RUNNER_METADATA', 'MARKET_DESCRIPTION']
    });
  }

  async getMarketBooks(marketIds: string[]): Promise<any[]> {
    return this.request('listMarketBook', {
      marketIds,
      priceProjection: {
        priceData: ['EX_BEST_OFFERS', 'EX_TRADED'],
        virtualise: true
      }
    });
  }

  async fetchLiveMatches(): Promise<CricketMatch[]> {
    try {
      const events = await this.listLiveCricketEvents();
      if (!events || events.length === 0) return [];

      const eventIds = events.map(e => e.event.id);
      const catalogues = await this.getMarketCatalogue(eventIds);
      const marketIds = catalogues.map(c => c.marketId);
      const books = await this.getMarketBooks(marketIds);

      return events.map(eventData => {
        const event = eventData.event;
        const eventMarkets = catalogues.filter(c => c.event.id === event.id);
        
        const marketLines: MarketLine[] = eventMarkets.map(cat => {
          const book = books.find(b => b.marketId === cat.marketId);
          if (!book) return null;

          // Simple mapping for primary winner market
          const runner = book.runners[0];
          const backPrice = runner?.ex?.availableToBack?.[0]?.price || 1.01;
          const layPrice = runner?.ex?.availableToLay?.[0]?.price || 1.02;

          const type: MarketType = cat.marketName.includes('Match Odds') ? 'MATCH_WINNER' : 'INN_RUNS';

          return {
            id: cat.marketId,
            type,
            label: cat.marketName,
            classification: determineMarketClassification(type, backPrice),
            backOdds: backPrice,
            layOdds: layPrice,
            totalMatched: book.totalMatched || 0,
            backLiquidity: runner?.ex?.availableToBack?.[0]?.size || 0,
            layLiquidity: runner?.ex?.availableToLay?.[0]?.size || 0,
            lastUpdated: new Date().toISOString()
          };
        }).filter(Boolean) as MarketLine[];

        return {
          id: event.id,
          teamA: event.name.split(' v ')[0] || 'Team A',
          teamB: event.name.split(' v ')[1] || 'Team B',
          scoreA: 'Live', // Betfair API doesn't always provide scores in standard betting endpoints
          scoreB: '',
          status: MatchStatus.LIVE,
          format: 'T20', // Default or derived from event name
          venue: event.venue || 'Unknown Venue',
          overs: '0.0',
          startingOddsA: 1.9, // This would ideally come from historical data service
          startingOddsB: 1.9,
          marketLines,
          advisesUsed: 0,
          isLiveBetfair: true
        };
      });
    } catch (e) {
      console.error("Betfair Sync Error:", e);
      throw e;
    }
  }
}
