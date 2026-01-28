
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CricketMatch, AIEdge, StructuralContext, MarketLine, UserRule } from "../types";
import { determineMarketClassification } from "../constants";

export interface StructuralAnalysis {
  context: StructuralContext;
  consensusLevel: number;
  expertBreakdown: {
    statsNode: boolean;
    marketNode: boolean;
    tacticalNode: boolean;
    sentimentNode: boolean;
    whaleNode: boolean;
  };
  observations: Array<{
    marketId: string;
    type: 'INFLATION' | 'COMPRESSION' | 'VARIANCE_PLAY';
    confidence: number;
    reasoning: string[];
    expertsConcurred: string[];
    triggeredRules: string[];
  }>;
}

const AI_CACHE: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 300000; 

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getCached(key: string) {
    const entry = AI_CACHE[key];
    if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
      return entry.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    AI_CACHE[key] = { data, timestamp: Date.now() };
  }

  async searchMarketOdds(match: { teamA: string, teamB: string }): Promise<MarketLine[]> {
    const cacheKey = `odds_${match.teamA}_${match.teamB}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `REAL-TIME DATA REQUEST: Find current live betting exchange odds (back/lay) for ${match.teamA} vs ${match.teamB}. 
        Focus on Betfair, Diamond, or Jeebet current lines. 
        Return ONLY valid JSON with properties: backOdds (number), layOdds (number), volume (number).`,
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              backOdds: { type: Type.NUMBER },
              layOdds: { type: Type.NUMBER },
              volume: { type: Type.NUMBER }
            },
            required: ["backOdds", "layOdds"]
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      if (!data.backOdds) return [];

      const result: MarketLine[] = [{
        id: `ai_live_${Date.now()}`,
        type: 'MATCH_WINNER',
        label: 'Match Winner',
        classification: determineMarketClassification('MATCH_WINNER', data.backOdds),
        backOdds: data.backOdds,
        layOdds: data.layOdds || (data.backOdds + 0.05),
        totalMatched: data.volume || 1500000,
        backLiquidity: 45000,
        layLiquidity: 42000,
        lastUpdated: new Date().toISOString(),
        source: 'LIVE_EXCHANGE'
      }];

      this.setCache(cacheKey, result);
      return result;
    } catch (e: any) {
      if (e.status === 429) throw new Error("QUOTA_EXHAUSTED");
      return [];
    }
  }

  async searchMarketPulse(match: CricketMatch, manualKnowledge?: string): Promise<{ text: string, sources: any[] }> {
    const cacheKey = `pulse_${match.id}_${manualKnowledge || ''}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `URGENT: Get live score and market sentiment for ${match.teamA} vs ${match.teamB}. Context: ${manualKnowledge || 'In-play'}. Identify if there are massive layoffs or volume spikes.`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const result = {
        text: response.text || "Pulse localized.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
      this.setCache(cacheKey, result);
      return result;
    } catch (error: any) {
      if (error.status === 429) throw new Error("QUOTA_EXHAUSTED");
      return { text: "Search node limited.", sources: [] };
    }
  }

  async analyzeMatchStructure(match: CricketMatch, pulseData: string, manualKnowledge?: string, userRules?: UserRule[]): Promise<StructuralAnalysis | null> {
    const ai = this.getClient();
    const rulesContext = userRules?.filter(r => r.isActive).map(r => `- ${r.name}: ${r.description} (${r.triggerLogic || ''})`).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `MISSION: Analyze Match Structure. 
        Match: ${match.teamA} v ${match.teamB}. 
        Live Data: ${pulseData}. 
        User Tactical Rules to Apply:\n${rulesContext}
        Overlay: ${manualKnowledge}`,
        config: {
          systemInstruction: "You are the WicketWise Neural Orchestrator. You identify market entropy. If a user rule triggers based on data, flag it.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              context: {
                type: Type.OBJECT,
                properties: {
                  venueBehavior: { type: Type.STRING },
                  volatilityIndex: { type: Type.NUMBER },
                  pressureClassification: { type: Type.STRING },
                  squadBalanceObservation: { type: Type.STRING }
                }
              },
              consensusLevel: { type: Type.INTEGER },
              expertBreakdown: {
                type: Type.OBJECT,
                properties: {
                  statsNode: { type: Type.BOOLEAN },
                  marketNode: { type: Type.BOOLEAN },
                  tacticalNode: { type: Type.BOOLEAN },
                  sentimentNode: { type: Type.BOOLEAN },
                  whaleNode: { type: Type.BOOLEAN }
                }
              },
              observations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    marketId: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["INFLATION", "COMPRESSION", "VARIANCE_PLAY"] },
                    confidence: { type: Type.NUMBER },
                    reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expertsConcurred: { type: Type.ARRAY, items: { type: Type.STRING } },
                    triggeredRules: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (e: any) {
      if (e.status === 429) throw new Error("QUOTA_EXHAUSTED");
      return null;
    }
  }
}
