import pytest
from decimal import Decimal
from app.services.arc_blockchain import get_onchain_balance, verify_onchain_tx, get_web3

# Check if RPC node is connected on module load
w3 = get_web3()
is_rpc_connected = False
try:
    is_rpc_connected = w3.is_connected()
except Exception:
    pass

@pytest.mark.skipif(not is_rpc_connected, reason="Arc L1 RPC node is unreachable")
def test_blockchain_connection():
    """Verify that we can connect to the Arc L1 Testnet RPC URL"""
    w3 = get_web3()
    assert w3.is_connected()
    
    # Check block number is greater than 0
    block_num = w3.eth.block_number
    assert block_num > 0
    
    # Check chain ID matches settings (5042002)
    assert w3.eth.chain_id == 5042002

def test_get_onchain_balance():
    """Verify get_onchain_balance returns a Decimal and works on dummy address"""
    dummy_address = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
    balance = get_onchain_balance(dummy_address)
    assert isinstance(balance, Decimal)
    assert balance >= Decimal("0.0")

def test_verify_onchain_tx_invalid():
    """Verify that verify_onchain_tx returns False for fake transaction hashes"""
    fake_tx = "0x" + "f" * 64
    sender = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
    receiver = "0x68defB751B7401B5f6d1476B71C7656EC7ab88b0"
    amount = Decimal("0.001")
    
    # Invalid tx hash should fail verification gracefully
    res = verify_onchain_tx(fake_tx, sender, receiver, amount)
    assert res is False
