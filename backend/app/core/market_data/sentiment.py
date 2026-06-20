"""
Social & News Sentiment Ingestion Engine
Ingests sentiment documents, generates embeddings, and saves them to the vector store.
"""

import random
import logging
from typing import List, Dict, Any
from app.services.vector_store import vector_store
from app.core.intelligence.gemini_client import gemini_client

logger = logging.getLogger(__name__)

SENTIMENT_DATA = {
    "BTCUSDT": [
        "Bitcoin spot ETFs record $450M net daily inflows, highlighting continued institutional demand.",
        "Social sentiment indices hit 'Extreme Greed' at 84/100, driven by retail FOMO as price crosses key resistance.",
        "Whale wallet tracking shows significant exchange outflows, pointing to strong accumulation behavior.",
        "Macro analysts note Bitcoin's correlation with tech stocks is dropping, solidifying its status as digital gold."
    ],
    "ETHUSDT": [
        "Ethereum Layer 2 active addresses reach an all-time high, driven by low transaction costs on Arbitrum and Base.",
        "Open interest in Ethereum futures spikes 12% in 24 hours, indicating major options traders are positioning for a breakout.",
        "Large-scale staking lockups reduce liquid supply on exchanges, creating potential for a supply squeeze.",
        "Developer survey shows high confidence in upcoming network efficiency upgrades."
    ],
    "SOLUSDT": [
        "Solana decentralized exchange volume temporarily flips Ethereum due to a massive wave of meme coin momentum.",
        "Validator network health remains high with 99.9% uptime, calming previous stability concerns.",
        "Institutional report lists Solana as a top candidate for institutional integration due to high transaction speed.",
        "Social engagement around Solana drops slightly but developer activity remains in the top 3."
    ],
    "EURUSD": [
        "European Central Bank hints at potential rate cuts in the upcoming quarter as Eurozone inflation cools to 2.2%.",
        "US Dollar Index (DXY) strengthens following better-than-expected retail sales data, putting pressure on EUR.",
        "Geopolitical developments in Eastern Europe create mild volatility spikes in Euro trading sessions.",
        "Retail forex trader sentiment is 58% net-long on EURUSD, indicating potential contrarian sell pressure."
    ]
}

class SentimentIngestor:
    """Manages ingestion of market sentiment summaries into the vector database"""

    async def ingest_sentiment_for_symbol(self, symbol: str) -> bool:
        """
        Ingests a random sentiment document for a symbol, generates embeddings, and stores it.
        """
        symbol_upper = symbol.upper()
        if symbol_upper not in SENTIMENT_DATA:
            logger.warning(f"No sentiment templates available for symbol: {symbol}")
            return False

        # Select a random document
        doc = random.choice(SENTIMENT_DATA[symbol_upper])
        logger.info(f"Ingesting sentiment for {symbol_upper}: '{doc[:40]}...'")

        # Generate embedding
        try:
            embedding = await gemini_client.generate_embedding(doc)
            
            # Store in vector database
            success = await vector_store.store_embedding(
                content=doc,
                embedding=embedding,
                metadata={
                    "category": "sentiment",
                    "symbol": symbol_upper,
                    "provider": "social_gravity_api"
                }
            )
            return success
        except Exception as e:
            logger.error(f"Failed to ingest sentiment for {symbol_upper}: {e}")
            return False

    async def seed_all_sentiment(self):
        """Seeds initial sentiment data for all supported symbols"""
        logger.info("🌱 Seeding all symbol sentiment data into local vector store...")
        for symbol in SENTIMENT_DATA.keys():
            for doc in SENTIMENT_DATA[symbol]:
                try:
                    embedding = await gemini_client.generate_embedding(doc)
                    await vector_store.store_embedding(
                        content=doc,
                        embedding=embedding,
                        metadata={
                            "category": "sentiment",
                            "symbol": symbol,
                            "provider": "social_gravity_api"
                        }
                    )
                except Exception as e:
                    logger.error(f"Error seeding sentiment for {symbol}: {e}")

# Global instance
sentiment_ingestor = SentimentIngestor()
