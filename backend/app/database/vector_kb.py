"""
Supabase Vector Database Integration
Stores and retrieves knowledge using vector embeddings
"""

import os
import logging
from typing import List, Dict, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class VectorKnowledgeBase:
    """
    Vector database for semantic knowledge storage and retrieval
    Uses Supabase pgvector for embedding-based search
    """
    
    def __init__(self):
        """Initialize vector database client"""
        self.url = os.getenv('SUPABASE_URL')
        # Use service role key if available for administrative write access, fallback to anon key
        self.key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')
        self.client: Optional[Client] = None
        self.connected = False
        
        # Check if credentials exist and are not placeholders
        has_credentials = (
            self.url and self.key and
            "your-project" not in self.url and
            "your-anon-key-here" not in self.key and
            "your-service-role-key-here" not in self.key
        )
        
        if has_credentials:
            try:
                self.client = create_client(self.url, self.key)
                self.connected = True
                logger.info("✅ Vector knowledge base connected")
            except Exception as e:
                logger.error(f"Vector DB connection failed: {e}")
        else:
            logger.warning("⚠️ Vector database not configured")
    
    async def store_knowledge(
        self,
        content: str,
        embedding: List[float],
        metadata: Dict,
        knowledge_type: str = "research"
    ) -> Optional[str]:
        """
        Store knowledge with vector embedding
        
        Args:
            content: Text content
            embedding: Vector embedding (768 or 1536 dimensions)
            metadata: Additional metadata
            knowledge_type: Type (research, pattern, strategy, etc.)
            
        Returns:
            Knowledge item ID
        """
        if not self.connected:
            logger.warning("Vector DB not connected")
            return None
        
        try:
            result = self.client.table('knowledge_base').insert({
                'content': content,
                'embedding': embedding,
                'metadata': metadata,
                'knowledge_type': knowledge_type,
                'created_at': 'now()'
            }).execute()
            
            logger.info(f"✅ Knowledge stored: {knowledge_type}")
            return result.data[0]['id'] if result.data else None
            
        except Exception as e:
            logger.error(f"Error storing knowledge: {e}")
            return None
    
    async def semantic_search(
        self,
        query_embedding: List[float],
        knowledge_type: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict]:
        """
        Perform semantic search using vector similarity
        
        Args:
            query_embedding: Query vector
            knowledge_type: Filter by type
            limit: Max results
            
        Returns:
            List of relevant knowledge items
        """
        if not self.connected:
            return []
        
        try:
            # Supabase pgvector similarity search
            # Would use: match_knowledge(query_embedding, threshold, limit)
            
            query = self.client.rpc(
                'match_knowledge',
                {
                    'query_embedding': query_embedding,
                    'match_threshold': 0.7,
                    'match_count': limit
                }
            )
            
            if knowledge_type:
                query = query.eq('knowledge_type', knowledge_type)
            
            result = query.execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []
    
    async def get_relevant_knowledge(
        self,
        strategy_name: str,
        market_conditions: Dict,
        embedding_model
    ) -> List[Dict]:
        """
        Get relevant knowledge for signal generation
        
        Args:
            strategy_name: Strategy being evaluated
            market_conditions: Current market data
            embedding_model: Model to generate embeddings
            
        Returns:
            Relevant knowledge items
        """
        if not self.connected:
            return []
        
        # Create query from context
        query_text = f"{strategy_name} {market_conditions.get('regime', '')} {market_conditions.get('session', '')}"
        
        # Generate embedding (would use Gemini embeddings)
        # query_embedding = await embedding_model.embed(query_text)
        
        # For now, return empty (would perform actual search)
        logger.info(f"Searching knowledge for: {query_text}")
        return []
    
    async def index_research_paper(self, title: str, content: str, embedding_model):
        """
        Index a quant research paper
        
        Args:
            title: Paper title
            content: Paper content
            embedding_model: Embedding generator
        """
        if not self.connected:
            return
        
        # Would chunk content and generate embeddings
        # Then store each chunk with metadata
        
        logger.info(f"Indexing research: {title}")
        
        # Placeholder
        # chunks = chunk_text(content, max_length=500)
        # for chunk in chunks:
        #     embedding = await embedding_model.embed(chunk)
        #     await self.store_knowledge(
        #         content=chunk,
        #         embedding=embedding,
        #         metadata={'title': title, 'type': 'research_paper'},
        #         knowledge_type='research'
        #     )
    
    async def get_statistics(self) -> Dict:
        """Get knowledge base statistics"""
        if not self.connected:
            return {'total_items': 0}
        
        try:
            result = self.client.table('knowledge_base')\
                .select('knowledge_type', count='exact')\
                .execute()
            
            return {
                'total_items': result.count if hasattr(result, 'count') else 0
            }
        except Exception as e:
            logger.error(f"Error fetching stats: {e}")
            return {'total_items': 0}


# Global instance
vector_kb = VectorKnowledgeBase()
