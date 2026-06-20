import asyncio, os
os.environ['DATABASE_URL'] = 'sqlite:///./test_init2.db'
os.environ['GEMINI_API_KEY'] = 'test-key'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key-for-smoke-test-only-32chars'

# Import models FIRST so they register with Base.metadata
import app.models  # noqa
from app.database import init_db, Base

async def t():
    print('Tables registered in metadata BEFORE init:', list(Base.metadata.tables.keys()))
    try:
        await init_db()
        print('init_db OK')
    except Exception as e:
        print('init_db FAILED:', type(e).__name__, str(e)[:200])
    from app.database.postgres import engine
    from sqlalchemy import inspect
    async with engine.connect() as conn:
        tables = await conn.run_sync(lambda c: inspect(c).get_table_names())
    print('Async engine tables AFTER init:', tables)

asyncio.run(t())
