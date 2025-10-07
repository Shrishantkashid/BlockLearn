import requests

def test_user_login_functionality():
    base_url = "http://localhost:5000"
    url = f"{base_url}/api/auth/login"
    headers = {
        "Content-Type": "application/json"
    }
    # Replace these test credentials with valid ones as needed
    payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    json_response = response.json()
    assert "token" in json_response, "Response JSON does not contain 'token'"
    token = json_response["token"]
    assert isinstance(token, str) and len(token) > 0, "JWT token is empty or not a string"

test_user_login_functionality()