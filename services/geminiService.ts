
import { GoogleGenAI, Type } from "@google/genai";
import { CricketMatch, AIEdge, StructuralContext } from "../types";

export interface StructuralAnalysis {
  context: StructuralContext;
  consensusLevel: number;
  observations: Array<{
    marketId: string;
    type: 'INFLATION' | 'COMPRESSION' | 'VARIANCE_PLAY';
    confidence: number;
    reasoning: string[];
    expertsConcurred: string[];
  }>;
}

export class GeminiService {
  // Uses process.env.API_KEY directly as required by guidelines
  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("WicketWise AI: API_KEY not detected in environment.");
    }
    return new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async searchMarketPulse(match: CricketMatch, manualKnowledge?: string): Promise<{ text: string, sources: any[] }> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Research current live market sentiment, betting liquidity, and news for ${match.teamA} vs ${match.teamB}. User Manual Knowledge: ${manualKnowledge || 'None'}`,
        config: { tools: [{ googleSearch: {} }] }
      });
      return {
        text: response.text || "Market pulse analyzed.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      console.error("Pulse Search Error:", error);
      return { text: "Search temporarily unavailable.", sources: [] };
    }
  }

  async analyzeMatchStructure(match: CricketMatch, pulseData: string, manualKnowledge?: string): Promise<StructuralAnalysis | null> {
    const ai = this.getClient();
    const systemInstruction = `You are WicketWise AI, a high-frequency Cricket Syndicate Consensus Engine. 
    Evaluate trade opportunities using three expert personas:
    1. The Market Maker: Evaluates price inflation, volatility, and bookmaker liability.
    2. The Statistician: Evaluates live scoring rates against historical mean reversion.
    3. The Ground Analyst: Evaluates pitch decay, weather changes, and venue psychology.
    
    CRITICAL RULE: Only flag an edge if 2 or more experts concur on the probability. 
    Return a structured JSON output only.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Match: ${match.teamA} v ${match.teamB}. Score: ${match.scoreA} (${match.overs}). Pulse: ${pulseData}. User Insight: ${manualKnowledge}`,
        config: {
          systemInstruction,
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
                },
                required: ["venueBehavior", "volatilityIndex", "pressureClassification", "squadBalanceObservation"]
              },
              consensusLevel: { type: Type.INTEGER, description: "Number of experts (1-3) who concur." },
              observations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    marketId: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["INFLATION", "COMPRESSION", "VARIANCE_PLAY"] },
                    confidence: { type: Type.NUMBER },
                    reasoning: { type: Type.ARRAY, items: { type: Type.STRING } },
                    expertsConcurred: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["marketId", "type", "confidence", "reasoning", "expertsConcurred"]
                }
              }
            },
            required: ["context", "consensusLevel", "observations"]
          }
        }
      });
      
      const text = response.text;
      if (!text) return null;
      return JSON.parse(text.trim());
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return null;
    }
  }
}
