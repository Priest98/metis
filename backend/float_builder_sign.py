import os
import time
import json
from eth_account import Account
from eth_account.messages import encode_typed_data

def main():
    private_key = os.environ.get("BUILDER_PRIVATE_KEY")
    expected_agent = os.environ.get("EXPECTED_AGENT")
    rationale = os.environ.get("RATIONALE", "My agent uses Shadow Float to buy a paid market/data snapshot over x402 before deciding whether to act.")

    if not private_key:
        print("Error: BUILDER_PRIVATE_KEY environment variable is missing")
        return
    if not expected_agent:
        print("Error: EXPECTED_AGENT environment variable is missing")
        return

    # Normalize key format
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    try:
        account = Account.from_key(private_key)
    except Exception as e:
        print(f"Error: Invalid private key format: {e}")
        return

    derived_address = account.address

    if derived_address.lower() != expected_agent.lower():
        print(f"Error: Derived address {derived_address} does not match expected agent {expected_agent}")
        return

    domain_data = {
        "name": "ShadowFloat",
        "version": "1",
        "chainId": 5042002,
        "verifyingContract": "0xf305647ba0ff7f1e2d4be5f37f2ef9f930531057"
    }

    message_types = {
        "FloatSpendIntent": [
            {"name": "agent", "type": "address"},
            {"name": "provider", "type": "address"},
            {"name": "endpointHash", "type": "bytes32"},
            {"name": "amountUSDC", "type": "uint256"},
            {"name": "nonce", "type": "uint256"},
            {"name": "expiry", "type": "uint256"},
            {"name": "reason", "type": "string"}
        ]
    }

    # Generate current timestamp values
    nonce = int(time.time() * 1000)
    expiry = int(time.time() + 86400)  # Valid for 24 hours

    message_data = {
        "agent": derived_address,
        "provider": "0x8ddf06fE8985988d3e0883F945E891BD57084937",
        "endpointHash": "0x54f180bcd31ab4c3401b23bc78cb3eeb89f85d42a3b43e3d06a692b91d941160",
        "amountUSDC": 10000,
        "nonce": nonce,
        "expiry": expiry,
        "reason": rationale
    }

    # Encode EIP-712 typed data message
    signable_msg = encode_typed_data(
        domain_data=domain_data,
        message_types=message_types,
        message_data=message_data
    )
    
    # Sign locally
    signed_msg = Account.sign_message(signable_msg, private_key)

    # Format output JSON
    output = {
        "intent": {
            "agent": message_data["agent"],
            "provider": message_data["provider"],
            "endpointHash": message_data["endpointHash"],
            "amountUSDC": str(message_data["amountUSDC"]),
            "nonce": str(message_data["nonce"]),
            "expiry": str(message_data["expiry"]),
            "reason": message_data["reason"],
            "float": domain_data["verifyingContract"],
            "chainId": domain_data["chainId"]
        },
        "signature": f"0x{signed_msg.signature.hex()}",
        "digest": f"0x{signed_msg.message_hash.hex()}"
    }

    print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
