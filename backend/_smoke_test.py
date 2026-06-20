"""Smoke test - boots the app, hits key endpoints, reports errors."""
import asyncio
import os
import sys
import traceback

os.environ['DATABASE_URL'] = 'sqlite:///./test_metis.db'
os.environ['GEMINI_API_KEY'] = os.environ.get('GEMINI_API_KEY', 'test-key')
os.environ['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'test-secret-key-for-smoke-test-only-32chars')

async def main():
    try:
        from app.main import app
        from httpx import AsyncClient, ASGITransport
        from app.database import init_db
    except Exception as e:
        print(f"IMPORT FAILED: {e}")
        traceback.print_exc()
        return

    print("Initializing test database...")
    await init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test', timeout=15) as client:
        # Lifespan runs on first request via ASGITransport
        for path in ['/health', '/', '/api/v1/stats/', '/api/v1/signals/', '/api/v1/mcp/']:
            try:
                r = await client.get(path)
                body = r.text[:300].replace('\n', ' ')
                print(f"GET {path} -> {r.status_code} | {body}")
            except Exception as e:
                print(f"GET {path} -> ERROR: {e}")

        # Test auth login (creates a user)
        try:
            r = await client.post('/api/v1/auth/login', json={'email': 'smoketest@metis.test'})
            print(f"POST /auth/login -> {r.status_code} | {r.text[:300]}")
            if r.status_code == 200:
                token = r.json().get('token')
                headers = {'Authorization': f'Bearer {token}'}
                # Test authenticated endpoints
                for path in ['/api/v1/wallet/me', '/api/v1/wallet/history', '/api/v1/wallet/agents', '/api/v1/strategies/']:
                    try:
                        r2 = await client.get(path, headers=headers)
                        print(f"GET {path} (auth) -> {r2.status_code} | {r2.text[:200]}")
                    except Exception as e:
                        print(f"GET {path} (auth) -> ERROR: {e}")
        except Exception as e:
            print(f"POST /auth/login -> ERROR: {e}")
            traceback.print_exc()

asyncio.run(main())
print("SMOKE TEST COMPLETE")
