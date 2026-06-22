"""Google Gemini AI Client"""

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from app.config import settings
import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Safety settings - minimal blocking for trading analysis
SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}


class GeminiClient:
    """Client for Google Gemini AI API"""
    
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            safety_settings=SAFETY_SETTINGS,
        )
        logger.info(f"Initialized Gemini client with model: {settings.GEMINI_MODEL}")
    
    async def analyze_signal_context(
        self,
        signal_candidate: Dict[str, Any],
        strategy_stats: Dict[str, Any],
        market_conditions: Dict[str, Any],
        relevant_knowledge: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Analyze signal context using Gemini AI.
        
        Args:
            signal_candidate: Signal details (symbol, direction, prices, scores)
            strategy_stats: Strategy performance metrics
            market_conditions: Current market regime and conditions
            relevant_knowledge: Relevant knowledge from vector database
        
        Returns:
            Dict with confidence_level, risk_rating, explanation, position_sizing, risks
        """
        try:
            # Build context prompt
            prompt = self._build_context_prompt(
                signal_candidate,
                strategy_stats,
                market_conditions,
                relevant_knowledge
            )
            
            # Generate analysis
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent analysis
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=1024,
                    response_mime_type="application/json",
                )
            )
            
            # Parse JSON response
            analysis = json.loads(response.text)
            
            logger.info(f"Gemini analysis completed for {signal_candidate.get('symbol')}")
            
            return {
                "confidence_level": analysis.get("confidence_level", "Medium"),
                "risk_rating": analysis.get("risk_rating", "Medium"),
                "trade_explanation": analysis.get("trade_explanation", ""),
                "position_sizing": float(analysis.get("position_sizing", 2.0)),
                "key_risks": analysis.get("key_risks", []),
                "raw_response": analysis
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            return self._default_response()
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._default_response()
    
    def _build_context_prompt(
        self,
        signal: Dict[str, Any],
        stats: Dict[str, Any],
        market: Dict[str, Any],
        knowledge: Optional[list]
    ) -> str:
        """Build comprehensive context prompt for Gemini"""
        
        knowledge_section = ""
        if knowledge:
            knowledge_section = "\n\n**Relevant Knowledge:**\n" + "\n".join(
                [f"- {item}" for item in knowledge[:3]]  # Top 3 items
            )
        
        prompt = f"""You are a quantitative trading analyst for an institutional hedge fund.
Analyze the following signal candidate and provide your institutional-grade assessment.

**Signal Candidate:**
- Symbol: {signal.get('symbol')}
- Direction: {signal.get('direction')}
- Entry Price: {signal.get('entry')}
- Stop Loss: {signal.get('stop_loss')}
- Take Profit: {signal.get('take_profit')}
- Probability Score: {signal.get('probability_score')}%
- Signal Score: {signal.get('signal_score')}/10

**Strategy Statistics:**
- Name: {stats.get('name')}
- Win Rate: {stats.get('win_rate')}%
- Sharpe Ratio: {stats.get('sharpe')}
- Total Trades: {stats.get('total_trades')}
- Expectancy: {stats.get('expectancy')}

**Market Conditions:**
- Regime: {market.get('regime')}
- Volatility: {market.get('volatility')}
- Session: {market.get('session')}
- Recent Events: {', '.join(market.get('recent_news', []))}
{knowledge_section}

**Required Output (JSON format):**
Return a JSON object with these exact fields:
{{
  "confidence_level": "High" | "Medium" | "Low",
  "risk_rating": "Low" | "Medium" | "High" | "Very High",
  "trade_explanation": "2-3 sentence institutional-grade explanation of setup validity",
  "position_sizing": 0.5 to 5.0 (recommended % of capital),
  "key_risks": ["risk 1", "risk 2", "risk 3"]
}}

Be precise, data-driven, and focus on statistical validity.
"""
        return prompt
    
    def _default_response(self) -> Dict[str, Any]:
        """Return safe default response if Gemini fails"""
        return {
            "confidence_level": "Low",
            "risk_rating": "High",
            "trade_explanation": "AI analysis unavailable - manual review required",
            "position_sizing": 1.0,
            "key_risks": ["AI analysis failed"],
            "raw_response": {}
        }
    
    async def generate_embedding(self, text: str) -> list:
        """
        Generate text embedding for vector search.
        
        Args:
            text: Text to embed
        
        Returns:
            List of embedding values (3072 dimensions)
        """
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type="retrieval_document",
                output_dimensionality=768
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return [0.0] * 768  # Return zero vector on error


# Global client instance
gemini_client = GeminiClient()
