import uvicorn
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

if __name__ == "__main__":
    print("🚀 Starting Metis Platform...")
    print("   - Market Data: Binance WebSocket")
    print("   - Database: Supabase")
    print("   - AI: Google Gemini")
    print("   - Distribution: WebSocket + Telegram")
    print("\n🌍 API running at http://localhost:8000")
    print("📚 Docs running at http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
