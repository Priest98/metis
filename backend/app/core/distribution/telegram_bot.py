"""
Telegram Bot Integration
Distributes signals via Telegram
"""

import asyncio
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class TelegramBot:
    """
    Telegram bot for signal distribution
    Uses telegram-bot-api to send formatted signals
    """
    
    def __init__(self, bot_token: Optional[str] = None, channel_id: Optional[str] = None):
        """
        Initialize Telegram bot
        
        Args:
            bot_token: Telegram bot API token
            channel_id: Channel or chat ID to send messages to
        """
        self.bot_token = bot_token
        self.channel_id = channel_id
        self.enabled = bool(bot_token and channel_id)
        
        if self.enabled:
            logger.info("✅ Telegram bot initialized")
        else:
            logger.warning("⚠️ Telegram bot disabled (no credentials)")
    
    async def send_signal(self, signal: dict):
        """
        Send trading signal to Telegram channel
        
        Args:
            signal: Signal dictionary
        """
        if not self.enabled:
            logger.debug("Telegram disabled, skipping signal send")
            return
        
        # Format signal message
        message = self._format_signal_message(signal)
        
        try:
             # Use httpx for async HTTP request to Telegram API
            import httpx
            
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            payload = {
                "chat_id": self.channel_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10.0)
                response.raise_for_status()
                
            logger.info(f"📱 Telegram: {signal['symbol']} {signal['direction']} signal sent")
            
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
    
    def _format_signal_message(self, signal: dict) -> str:
        """
        Format signal as Telegram message
        
        Returns formatted markdown message
        """
        direction_emoji = "🟢" if signal['direction'] == 'BUY' else "🔴"
        
        message = f"""
🚀 *Metis Signal* 🚀

{direction_emoji} *{signal['symbol']} - {signal['direction']}*

📊 *Trade Details:*
• Entry: `{signal['entry_price']}`
• Stop Loss: `{signal['stop_loss']}`
• Take Profit: `{signal['take_profit']}`

📈 *Statistics:*
• Signal Score: `{signal['signal_score']}/10` ⭐
• Probability: `{signal['probability_score']}%` 🎯
• Confidence: `{signal['confidence_level']}` 
• Risk: `{signal['risk_rating']}`
• Position Size: `{signal['position_sizing']}%`

💡 *Analysis:*
{signal['trade_explanation']}

⏰ Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
"""
        return message.strip()
    
    async def send_alert(self, message: str):
        """Send general alert message"""
        if self.enabled:
             try:
                import httpx
                url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
                payload = {"chat_id": self.channel_id, "text": f"⚠️ *ALERT*: {message}", "parse_mode": "Markdown"}
                async with httpx.AsyncClient() as client:
                    await client.post(url, json=payload)
             except Exception:
                 pass

    async def send_stats(self, stats: dict):
        """Send daily/weekly statistics"""
        if not self.enabled:
            return
        
        message = f"""
📊 *Metis Statistics* 📊

• Active Signals: {stats.get('active_signals', 0)}
• Avg Score: {stats.get('avg_score', 0)}/10
• Avg Probability: {stats.get('avg_probability', 0)}%
• Win Rate: {stats.get('win_rate', 0)}%

✨ System Status: Operational
"""
        try:
            import httpx
            url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
            payload = {"chat_id": self.channel_id, "text": message, "parse_mode": "Markdown"}
            async with httpx.AsyncClient() as client:
                await client.post(url, json=payload)
            logger.info("📱 Telegram: Stats update sent")
        except Exception as e:
            logger.error(f"Failed to send Telegram stats: {e}")


# Global instance
telegram_bot = TelegramBot()

