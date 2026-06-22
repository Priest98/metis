
import asyncio
import random
from datetime import datetime, timedelta
import uuid
import os
from dotenv import load_dotenv

# Load env variables BEFORE importing app modules
load_dotenv()

from app.database.supabase_client import supabase_client

async def seed_data():
    if not supabase_client.connected:
        print("❌ Supabase client not connected. checking credentials...")
        print(f"URL: {os.getenv('SUPABASE_URL')}")
        print(f"KEY: {os.getenv('SUPABASE_KEY')[:10]}..." if os.getenv('SUPABASE_KEY') else "KEY: None")
        return

    print("🌱 Starting data seeding via Supabase Client...")
    
    # 1. Get/Create User via Auth
    # unique_id = uuid.uuid4().hex[:8]
    user_email = "seed_master@quant101.com"
    user_password = "Password123!"
    user_id = None
    
    # Bypassing auth via pre-created user ID
    user_id = "7b7af4a9-fde8-4c5b-9212-9431f86e20c2"
    print(f"ℹ️ Bypassing auth. Using existing user_id: {user_id}")

    # 1.5 Ensure user exists in public.users (for FK)
    try:
        user_data = {
            'id': user_id,
            'email': user_email,
            'subscription_tier': 'institutional',
            'created_at': datetime.utcnow().isoformat()
        }
        # Check if exists
        res = supabase_client.client.table('users').select('*').eq('id', user_id).execute()
        if not res.data:
            supabase_client.client.table('users').insert(user_data).execute()
            print(f"✅ Synced user to public table: {user_id}")
    except Exception as e:
        print(f"⚠️ Could not sync to public users (might already exist or trigger handled): {e}")

    # 2. Create a Default Strategy
    strategy_name = f"AlphaSentient V4 {uuid.uuid4().hex[:4]}"
    strategy_id = str(uuid.uuid4())
    
    try:
        res = supabase_client.client.table('strategies').select('*').eq('name', strategy_name).execute()
        if res.data:
            strategy_id = res.data[0]['id']
            print(f"ℹ️ Strategy {strategy_name} found: {strategy_id}")
        else:
            strategy_data = {
                'id': strategy_id,
                'user_id': user_id,
                'name': strategy_name,
                'description': "AI-driven mean reversion strategy with Gemini sentiment analysis",
                'strategy_type': "hybrid",
                'config': {"timeframe": "4h", "risk_level": "medium"},
                'is_active': True,
                'created_at': datetime.utcnow().isoformat()
            }
            res = supabase_client.client.table('strategies').insert(strategy_data).execute()
            if res.data:
                strategy_id = res.data[0]['id']
                print(f"✅ Created strategy: {strategy_name}")
    except Exception as e:
        print(f"❌ Error creating strategy: {e}")
        return # Cannot proceed without strategy

    # 3. Create Realistic Signals
    symbols = [("BTCUSDT", 45000), ("ETHUSDT", 2800), ("SOLUSDT", 110), ("AVAXUSDT", 35), ("LINKUSDT", 18)]
    directions = ["BUY", "SELL"]
    confidences = ["High", "Medium", "Low"]
    explanations = [
        "Bullish divergence on RSI combined with Gemini sentiment analysis showing strong institutional accumulation.",
        "Breakout above key resistance level verified by volume profile and on-chain metrics.",
        "Bearish engulfing candle on 4H timeframe suggesting short-term reversal.",
        "Oversold conditions on stochastic oscillator indicating potential bounce.",
        "Key Fibonacci retracement level holding support with increasing buy pressure."
    ]

    print("🚀 Seeding signals...")
    count = 0
    for i in range(20):
        symbol, base_price = random.choice(symbols)
        direction = random.choice(directions)
        
        # Add some randomness to price
        price_variance = base_price * 0.05
        entry_price = base_price + random.uniform(-price_variance, price_variance)
        
        if direction == "BUY":
            stop_loss = entry_price * 0.95
            take_profit = entry_price * 1.10
        else:
            stop_loss = entry_price * 1.05
            take_profit = entry_price * 0.90

        signal_data = {
            'strategy_id': strategy_id,
            'symbol': symbol,
            'direction': direction,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'probability_score': random.uniform(60, 95),
            'signal_score': random.uniform(6.0, 9.8),
            'confidence_level': random.choice(confidences),
            'risk_rating': "Low" if random.random() > 0.5 else "Medium",
            'trade_explanation': random.choice(explanations),
            'position_sizing': random.uniform(1.0, 5.0),
            'status': "active",
            'created_at': (datetime.utcnow() - timedelta(hours=random.randint(0, 48))).isoformat(),
            # Status update requires checking if expired. But let's just create them.
        }
        
        # Use store_signal from client wrapper which handles some defaults, but we want to specify created_at
        # So using client.table.insert directly might be better OR update store_signal to accept created_at (it does)
        
        res = await supabase_client.store_signal(signal_data)
        if res:
            count += 1
            print(f".", end="", flush=True)
            
    print(f"\n✅ Seeded {count} new signals")

if __name__ == "__main__":
    asyncio.run(seed_data())
