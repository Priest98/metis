"""
Quick test to verify API credentials
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test Gemini API connection"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in .env")
        return False
    
    if not api_key.startswith('AIzaSy'):
        print("⚠️ GEMINI_API_KEY format looks incorrect")
        return False
    
    print(f"✅ Gemini API key found: {api_key[:20]}...")
    
    # Try actual connection
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content("Say 'API works!'")
        print(f"✅ Gemini API Response: {response.text}")
        return True
    except Exception as e:
        print(f"❌ Gemini API Error: {e}")
        return False

def test_supabase():
    """Test Supabase connection"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_KEY')
    
    if not url or 'your-project' in url:
        print("⚠️ SUPABASE_URL not configured yet")
        return False
    
    if not key or 'your-anon' in key:
        print("⚠️ SUPABASE_KEY not configured yet")
        return False
    
    print(f"✅ Supabase URL: {url}")
    print(f"✅ Supabase Key: {key[:20]}...")
    
    try:
        from supabase import create_client
        client = create_client(url, key)
        print("✅ Supabase client created successfully")
        return True
    except Exception as e:
        print(f"❌ Supabase Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TRADERCOPILOT API CREDENTIALS TEST")
    print("=" * 60)
    
    print("\n1. Testing Gemini API...")
    gemini_ok = test_gemini_api()
    
    print("\n2. Testing Supabase...")
    supabase_ok = test_supabase()
    
    print("\n" + "=" * 60)
    if gemini_ok and supabase_ok:
        print("✅ ALL CREDENTIALS VALID - READY TO LAUNCH!")
    elif gemini_ok:
        print("✅ Gemini OK | ⚠️ Configure Supabase URL to complete setup")
    else:
        print("⚠️ Check your credentials and try again")
    print("=" * 60)
