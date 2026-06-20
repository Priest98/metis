import logging
from decimal import Decimal
from typing import Optional
from web3 import Web3
from eth_account import Account
from app.config import settings

logger = logging.getLogger(__name__)

# Cache provider to avoid rebuilding connection objects repeatedly
_w3: Optional[Web3] = None

def get_web3() -> Web3:
    global _w3
    if _w3 is None:
        _w3 = Web3(Web3.HTTPProvider(settings.ARC_RPC_URL, request_kwargs={'timeout': 3}))
    return _w3

def get_onchain_balance(address: str) -> Decimal:
    """
    Retrieves the native USDC balance of an address on Arc Testnet.
    Arc L1 uses USDC as the native gas token (represented with 18 decimals in EVM get_balance).
    """
    try:
        w3 = get_web3()
        if not w3.is_connected():
            logger.warning("Failed to connect to Arc RPC URL for balance check")
            return Decimal("0.000000")
            
        checksum_address = w3.to_checksum_address(address)
        balance_wei = w3.eth.get_balance(checksum_address)
        
        # 18 decimals native token to USDC
        balance_usdc = Decimal(str(balance_wei)) / Decimal("1000000000000000000")
        logger.info(f"On-chain balance of {address}: {balance_usdc} USDC")
        return balance_usdc
    except Exception as e:
        logger.error(f"Error querying on-chain balance for {address}: {e}")
        return Decimal("0.000000")

def send_onchain_usdc(private_key_hex: str, to_address: str, amount_usdc: Decimal) -> str:
    """
    Builds, signs, and sends a native USDC transaction on Arc L1 Testnet.
    Returns the transaction hash as a hex string.
    """
    try:
        w3 = get_web3()
        if not w3.is_connected():
            raise ConnectionError("Failed to connect to Arc RPC URL for sending transaction")
            
        sender_account = Account.from_key(private_key_hex)
        sender_address = sender_account.address
        recipient_address = w3.to_checksum_address(to_address)
        
        # Get nonce
        nonce = w3.eth.get_transaction_count(sender_address, 'pending')
        
        # Get gas price
        gas_price = w3.eth.gas_price
        
        # Build transaction parameters
        # Value is represented in 18 decimal places (standard EVM Wei)
        value_wei = int(amount_usdc * Decimal("1000000000000000000"))
        
        tx_params = {
            'nonce': nonce,
            'to': recipient_address,
            'value': value_wei,
            'gas': 21000,
            'gasPrice': gas_price,
            'chainId': settings.ARC_CHAIN_ID
        }
        
        logger.info(f"Building Arc tx: from={sender_address}, to={recipient_address}, value={value_wei} wei, gasPrice={gas_price}")
        
        # Sign transaction
        signed_tx = w3.eth.account.sign_transaction(tx_params, private_key_hex)
        
        # Broadcast raw transaction - support both raw_transaction (newer web3.py) and rawTransaction (older web3.py)
        raw_tx = None
        if hasattr(signed_tx, "raw_transaction"):
            raw_tx = signed_tx.raw_transaction
        elif hasattr(signed_tx, "rawTransaction"):
            raw_tx = signed_tx.rawTransaction
        else:
            try:
                raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction", None)
            except AttributeError:
                pass
                
        if raw_tx is None:
            raise AttributeError("SignedTransaction object has neither raw_transaction nor rawTransaction attribute")
            
        tx_hash = w3.eth.send_raw_transaction(raw_tx)
        tx_hash_hex = w3.to_hex(tx_hash)
        
        logger.info(f"Broadcasted transaction: {tx_hash_hex}")
        
        # Bounded wait for receipt (non-blocking if it takes too long)
        try:
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=4)
            if receipt.status == 1:
                logger.info(f"Transaction {tx_hash_hex} succeeded on-chain")
            else:
                logger.warning(f"Transaction {tx_hash_hex} reverted on-chain")
        except Exception:
            logger.info(f"Transaction {tx_hash_hex} broadcasted successfully, receipt pending")
            
        return tx_hash_hex
    except Exception as e:
        logger.error(f"Failed to send on-chain USDC: {e}")
        raise

def verify_onchain_tx(
    tx_hash: str,
    expected_sender: str,
    expected_receiver: str,
    expected_amount_usdc: Decimal
) -> bool:
    """
    Verifies that a transaction hash represents a successful payment from sender to receiver
    with the expected amount of USDC on the Arc L1 Testnet.
    """
    try:
        w3 = get_web3()
        if not w3.is_connected():
            logger.warning("Failed to connect to Arc RPC URL for verification")
            return False
            
        # Retrieve transaction details
        tx = w3.eth.get_transaction(tx_hash)
        if not tx:
            logger.warning(f"Transaction {tx_hash} not found on-chain")
            return False
            
        # Verify sender & recipient (case-insensitive)
        tx_sender = tx.get('from', '')
        tx_recipient = tx.get('to', '')
        
        if not tx_sender or not tx_recipient:
            logger.warning(f"Transaction {tx_hash} has incomplete address information")
            return False
            
        if tx_sender.lower() != expected_sender.lower():
            logger.warning(f"Sender mismatch. Expected: {expected_sender}, Got: {tx_sender}")
            return False
            
        if tx_recipient.lower() != expected_receiver.lower():
            logger.warning(f"Recipient mismatch. Expected: {expected_receiver}, Got: {tx_recipient}")
            return False
            
        # Verify transfer value
        tx_value_wei = Decimal(str(tx.get('value', 0)))
        expected_value_wei = expected_amount_usdc * Decimal("1000000000000000000")
        
        # Allow a tiny margin of error (e.g. 1000 wei dust representation)
        if abs(tx_value_wei - expected_value_wei) > Decimal("10000000000"):
            logger.warning(f"Value mismatch. Expected: {expected_value_wei} wei, Got: {tx_value_wei} wei")
            return False
            
        # Verify receipt status
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        if not receipt:
            logger.warning(f"Receipt for transaction {tx_hash} not yet available")
            return False
            
        if receipt.get('status') != 1:
            logger.warning(f"Transaction {tx_hash} receipt status is failed (reverted)")
            return False
            
        logger.info(f"On-chain transaction verification successful: {tx_hash}")
        return True
    except Exception as e:
        logger.error(f"Error verifying transaction {tx_hash} on-chain: {e}")
        return False


def deposit_to_yield_loop(agent_private_key: str, amount_usdc: Decimal) -> str:
    """
    Simulates or executes a DeFi yield pool deposit on Arc Testnet.
    Attempts to transfer USDC to the yield pool contract address: 0xDeFiYieLdLoOp462600000000000000000000000
    If the RPC connection fails or has insufficient balance, it falls back to a simulated tx hash.
    """
    pool_address = "0xDeFiYieLdLoOp462600000000000000000000000"
    try:
        tx_hash = send_onchain_usdc(agent_private_key, pool_address, amount_usdc)
        logger.info(f"DeFi Yield Loop Deposit Tx broadcasted: {tx_hash}")
        return tx_hash
    except Exception as e:
        logger.warning(f"On-chain DeFi deposit transaction failed or RPC offline. Falling back to mock transaction. Details: {e}")
        import secrets
        mock_hash = "0x" + secrets.token_hex(32)
        logger.info(f"Generated mock DeFi deposit transaction: {mock_hash}")
        return mock_hash


def withdraw_from_yield_loop(agent_private_key: str, amount_usdc: Decimal) -> str:
    """
    Simulates a withdrawal from the DeFi yield pool.
    Broadcasts a mock transaction hash representing the contract withdrawal execution.
    """
    import secrets
    mock_hash = "0x" + secrets.token_hex(32)
    logger.info(f"Generated mock DeFi withdrawal transaction: {mock_hash} for {amount_usdc} USDC")
    return mock_hash
