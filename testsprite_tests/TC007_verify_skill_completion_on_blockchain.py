import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
PROXIES = {
    "http": "http://127.0.0.1:9322",
    "https": "http://127.0.0.1:9322"
}

def test_verify_skill_completion_on_blockchain():
    url = f"{BASE_URL}/api/blockchain/verify"
    # Example payload - adjust fields as per actual smart contract API requirements
    payload = {
        "sessionId": "test-session-123",
        "userId": "test-user-456",
        "skillId": "skill-789",
        "completionProof": "0xabcdef1234567890"  # e.g. blockchain transaction hash or signature
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT, proxies=PROXIES)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    data = response.json()
    # Validate expected keys and values in response
    assert isinstance(data, dict), "Response is not a JSON object"
    # Check at least the following fields are present in success response
    assert "verified" in data, "'verified' key missing in response"
    assert data["verified"] is True, "Skill completion was not verified"
    assert "tokensIssued" in data, "'tokensIssued' key missing in response"
    assert isinstance(data["tokensIssued"], (int, float)), "'tokensIssued' is not a number"
    assert data["tokensIssued"] > 0, "No tokens were issued for verified skill completion"

test_verify_skill_completion_on_blockchain()