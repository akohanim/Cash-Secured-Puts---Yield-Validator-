import { GoogleGenAI } from "@google/genai";
import { TradeCalculation, TradeInputs } from '../types';

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  try {
    // Check if process exists to avoid ReferenceError
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      if (!genAI) {
        genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
      }
      return genAI;
    }
  } catch (e) {
    console.warn("Environment API_KEY access failed:", e);
  }
  return null;
};

export const analyzeTradeRisk = async (
  inputs: TradeInputs,
  calculation: TradeCalculation,
  currentPrice: number
): Promise<string> => {
  const ai = getGenAI();
  if (!ai) {
    return "Gemini API Key not configured. Unable to fetch analysis.";
  }

  const prompt = `
    You are a senior financial risk analyst. Provide a concise risk assessment (max 100 words) for the following Cash-Secured Put (CSP) trade.
    
    Ticker: ${inputs.ticker}
    Current Price: $${currentPrice.toFixed(2)}
    
    Trade Details:
    - Strike Price: $${calculation.calculatedStrike}
    - Expiration (DTE): ${calculation.dte} days
    - Target Discount: ${inputs.targetDiscount}%
    - Collateral: $${calculation.collateral}
    - Premium Received: $${calculation.actualTotalCredit}
    - Annualized Return (APY): ${calculation.actualAPY.toFixed(2)}%
    
    Target APY was ${inputs.targetAPY}%. ${calculation.isTargetMet ? "Target Met." : "Target Missed."}
    
    Assess the downside risk, the quality of the premium relative to the risk, and the buffer against a drop. Be direct.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Unable to generate analysis at this time.";
  }
};