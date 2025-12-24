# CSP Validator Pro 📈

> **"Get paid to buy the stocks you love at the prices you want."**

CSP Validator Pro is a high-performance web application designed for options traders to validate **Cash-Secured Put (CSP)** yield targets against real-time market data. Built with React, Tailwind CSS, and powered by the Google Gemini API, this tool transforms raw options chains into actionable investment insights.

---

## 💎 The Investment Strategy: The Power of CSP

The **Cash-Secured Put** is a conservative, income-generating strategy favored by institutional and retail "Wheel Strategy" traders. 

### Why sell Puts?
1. **Income Generation**: You collect an immediate cash "premium" for promising to buy a stock at a specific price (the Strike).
2. **Buy at a Discount**: If the stock drops, you are "assigned" the shares at your strike price—effectively buying a dip you were already waiting for.
3. **The Yield Edge**: By targeting a specific **Annualized Percentage Yield (APY)**, you treat your capital like a high-yield engine rather than a speculative bet.

**CSP Validator Pro** ensures that the trades you enter actually meet your math. It calculates the required premium to hit your APY goals and compares it against live market bids instantly.

---

## 🚀 Key Features

- **Real-Time Data Waterfall**: A custom-built engine for Polygon.io (Free Tier compatible) that fetches underlying prices, maps expiration dates, and pulls specific contract quotes.
- **Dynamic APY Validation**: Move the sliders to set your target yield (e.g., 15% APY) and your desired "Margin of Safety" (e.g., 10% OTM discount).
- **Horizontal Expiration Carousel**: A sleek, "sliding bar" UI for quickly scanning different Time-to-Expiration (DTE) cycles.
- **AI Risk Analysis (Gemini 2.5)**: Integrated with Google's latest Gemini models to provide an instant, professional risk assessment of your specific trade parameters.
- **Network Request Monitor**: A built-in debug console to track live API performance and data integrity.

---

## 🛠 Technical Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS (Sleek Dark Mode UI)
- **Data Visuals**: Recharts
- **Market Data**: Polygon.io REST API
- **Artificial Intelligence**: Google Gemini API (@google/genai)

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/csp-validator-pro.git
   cd csp-validator-pro
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your API keys:
   ```env
   # Required for AI Analysis
   API_KEY=your_gemini_api_key
   
   # Optional: The app includes a default Polygon key, but you can override it
   MASSIVE_API_KEY=your_polygon_api_key
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## ⚠️ Disclaimer

*This application is for educational and informational purposes only. Options trading involves significant risk. Past performance is not indicative of future results. Always consult with a certified financial advisor before making investment decisions.*

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/csp-validator-pro/issues).

---

**Developed with ❤️ for the Trading Community.**