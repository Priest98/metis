
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from pydantic import BaseModel
import logging
from datetime import datetime
from app.core.auth import get_current_user

from app.services.vector_store import vector_store
from app.core.intelligence.gemini_client import gemini_client
from app.core.rate_limiter import rate_limiter

router = APIRouter()
logger = logging.getLogger(__name__)

class KnowledgeItem(BaseModel):
    content: str
    category: str = "general"
    tags: List[str] = []

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    threshold: float = 0.7

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_knowledge(request: Request, item: KnowledgeItem, current_user: dict = Depends(get_current_user)):
    """
    Ingest text content into the vector knowledge base
    """
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(f"ingest:{client_ip}", limit=5, period=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 5 ingests per minute."
        )

    try:
        # 1. Generate Embedding using Gemini
        embedding = await gemini_client.generate_embedding(item.content)
        
        if not embedding:
            raise HTTPException(status_code=500, detail="Failed to generate embedding")
            
        # 2. Store in Vector DB
        metadata = {
            "category": item.category,
            "tags": item.tags,
            "ingested_at": datetime.utcnow().isoformat()
        }
        
        success = await vector_store.store_embedding(item.content, embedding, metadata)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store in vector database")
            
        return {"status": "success", "message": "Knowledge ingested successfully"}
        
    except Exception as e:
        logger.error(f"Ingestion error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while ingesting knowledge.")

@router.post("/search", response_model=List[dict])
async def search_knowledge(request: Request, search_req: SearchRequest, current_user: dict = Depends(get_current_user)):
    """
    Semantic search in knowledge base
    """
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(f"search:{client_ip}", limit=10, period=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 searches per minute."
        )

    try:
        # 1. Embed query
        embedding = await gemini_client.generate_embedding(search_req.query)
        
        if not embedding:
            raise HTTPException(status_code=500, detail="Failed to generate query embedding")
            
        # 2. Search Vector DB
        results = await vector_store.search_similar(
            embedding, 
            limit=search_req.limit, 
            threshold=search_req.threshold
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while performing search.")
