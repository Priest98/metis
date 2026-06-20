
import logging
from typing import List, Dict, Optional, Any
from app.database import supabase_client
import math

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Service for interacting with Supabase Vector Store (pgvector).
    Handles storage and retrieval of knowledge embeddings.
    """
    
    def __init__(self):
        self.client = supabase_client
        
    async def store_embedding(self, content: str, embedding: List[float], metadata: Dict[str, Any] = None) -> bool:
        """
        Store a knowledge chunk with its embedding
        """
        if not self.client.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import KnowledgeBase
                import uuid
                async with AsyncSessionLocal() as session:
                    new_item = KnowledgeBase(
                        id=uuid.uuid4(),
                        content=content,
                        meta_data=metadata or {},
                        embedding=embedding
                    )
                    session.add(new_item)
                    await session.commit()
                logger.info(f"✅ Stored embedding locally for content: {content[:30]}...")
                return True
            except Exception as e:
                logger.error(f"Error storing embedding locally: {e}")
                return False
            
        try:
            data = {
                "content": content,
                "embedding": embedding,
                "metadata": metadata or {},
            }
            
            self.client.client.table("knowledge_base").insert(data).execute()
            logger.info(f"✅ Stored embedding for content: {content[:30]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error storing embedding: {e}")
            return False
            
    async def search_similar(self, embedding: List[float], limit: int = 5, threshold: float = 0.7) -> List[Dict]:
        """
        Search for similar content using vector similarity (cosine distance)
        Pre-requisite: A Postgres function `match_documents` must exist.
        """
        if not self.client.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import KnowledgeBase
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    result = await session.execute(select(KnowledgeBase))
                    items = result.scalars().all()
                    
                scored_items = []
                for item in items:
                    if item.embedding:
                        sim = self.cosine_similarity(embedding, item.embedding)
                        if sim >= threshold:
                            scored_items.append({
                                "id": str(item.id),
                                "content": item.content,
                                "metadata": item.meta_data or {},
                                "similarity": sim
                            })
                
                scored_items.sort(key=lambda x: x["similarity"], reverse=True)
                return scored_items[:limit]
            except Exception as e:
                logger.error(f"Error searching vector store locally: {e}")
                return []
            
        try:
            # Call the bespoke Postgres function for vector search
            # Params match the Supabase AI guide standard
            params = {
                "query_embedding": embedding,
                "match_threshold": threshold,
                "match_count": limit
            }
            
            result = self.client.client.rpc("match_knowledge", params).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Fallback local calculation if needed"""
        dot_product = sum(a*b for a,b in zip(v1, v2))
        magnitude_v1 = math.sqrt(sum(a*a for a in v1))
        magnitude_v2 = math.sqrt(sum(b*b for b in v2))
        if magnitude_v1 == 0 or magnitude_v2 == 0:
            return 0.0
        return dot_product / (magnitude_v1 * magnitude_v2)

# Global instance
vector_store = VectorStore()
