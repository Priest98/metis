from sqlalchemy.ext.declarative import declarative_base
from app.database.supabase_client import supabase_client
from app.database.vector_kb import vector_kb

Base = declarative_base()

from app.database.postgres import get_db, init_db, close_db, engine, AsyncSessionLocal
