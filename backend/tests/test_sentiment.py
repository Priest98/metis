import pytest
from app.core.market_data.sentiment import sentiment_ingestor

@pytest.mark.asyncio
async def test_ingest_sentiment_success(mocker):
    """Test successful sentiment ingestion and mock database vector storage"""
    
    # Mock embedding generation
    mocker.patch('app.core.intelligence.gemini_client.GeminiClient.generate_embedding', return_value=[0.1] * 768)
    
    # Mock vector store insertion
    mock_store = mocker.patch('app.services.vector_store.VectorStore.store_embedding', return_value=True)
    
    result = await sentiment_ingestor.ingest_sentiment_for_symbol("BTCUSDT")
    
    assert result is True
    assert mock_store.call_count == 1
    # Check that metadata has symbol BTCUSDT
    args, kwargs = mock_store.call_args
    assert kwargs['metadata']['symbol'] == 'BTCUSDT'
    assert kwargs['metadata']['category'] == 'sentiment'

@pytest.mark.asyncio
async def test_seed_all_sentiment(mocker):
    """Test that all symbol sentiment is correctly seeded"""
    
    mocker.patch('app.core.intelligence.gemini_client.GeminiClient.generate_embedding', return_value=[0.1] * 768)
    mock_store = mocker.patch('app.services.vector_store.VectorStore.store_embedding', return_value=True)
    
    await sentiment_ingestor.seed_all_sentiment()
    
    # Should insert 4 symbols * 4 templates = 16 insertions
    assert mock_store.call_count == 16
