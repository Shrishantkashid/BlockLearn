import requests

def test_google_oauth_authentication():
    base_url = "http://localhost:5000"
    url = f"{base_url}/api/auth/google"
    headers = {
        "Content-Type": "application/json"
    }

    try:
        # Sending empty JSON payload as PRD does not specify any fields
        response = requests.post(url, json={}, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
        data = response.json()
        assert "token" in data, "Response JSON does not contain 'token' field"
        token = data["token"]
        assert isinstance(token, str) and len(token) > 0, "JWT token should be a non-empty string"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_google_oauth_authentication()