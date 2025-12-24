export const APP_NAME = "CSP Validator Pro";

// --- POLYGON.IO CONFIGURATION ---
// Using REST API for Free Tier compatibility.
export const REST_API_BASE_URL = "https://api.polygon.io";

// Helper to safely get env var without crashing if process is undefined
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.MASSIVE_API_KEY) {
      return process.env.MASSIVE_API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return "lOfIwwiRIgRwkGvoNR1XINp5tcTg2LjO";
};

// API Key (from your screenshot)
export const API_KEY = getApiKey().trim();

export const DEFAULT_TICKER = "SPY";
export const DEFAULT_TARGET_APY = 15;
export const DEFAULT_TARGET_DISCOUNT = 5;

// Mock list of supported tickers for the simulation
export const SUPPORTED_TICKERS = ["SPY", "QQQ", "IWM", "TSLA", "AAPL", "AMD", "NVDA", "RIVN"];