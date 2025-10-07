import requests

BASE_URL = "http://localhost:5000"
PROXY = {
    "http": "http://localhost:5001",
    "https": "http://localhost:5001"
}
TIMEOUT = 30

def get_auth_token():
    """Authenticate user and return JWT token for authorization."""
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }
    resp = requests.post(login_url, json=login_payload, proxies=PROXY, timeout=TIMEOUT)
    resp.raise_for_status()
    token = resp.json().get("token")
    assert token, "Authentication token not returned"
    return token

def create_session(auth_token):
    """Create a new session to use as feedback target."""
    url = f"{BASE_URL}/api/sessions"
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    # Use minimal valid session creation data, assuming no details required from PRD
    payload = {
        "title": "Test Session",
        "description": "Session created for feedback test"
    }
    resp = requests.post(url, json=payload, headers=headers, proxies=PROXY, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    session_id = data.get("id") or data.get("_id")
    assert session_id, "No session ID returned after creation"
    return session_id

def delete_session(auth_token, session_id):
    """Cleanup by deleting the created session if API supports DELETE."""
    url = f"{BASE_URL}/api/sessions/{session_id}"
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    try:
        resp = requests.delete(url, headers=headers, proxies=PROXY, timeout=TIMEOUT)
        # It's possible delete is not implemented; ignore 404 or 405
        if resp.status_code not in (204, 200, 404, 405):
            resp.raise_for_status()
    except Exception:
        pass  # Best effort cleanup

def test_submit_session_feedback():
    auth_token = get_auth_token()
    session_id = None
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    try:
        session_id = create_session(auth_token)

        feedback_url = f"{BASE_URL}/api/feedback"
        feedback_payload = {
            "sessionId": session_id,
            "rating": 4.5,
            "comment": "Great session, very informative!"
        }

        response = requests.post(feedback_url, json=feedback_payload, headers=headers, proxies=PROXY, timeout=TIMEOUT)
        response.raise_for_status()

        response_data = response.json()
        # Validate that the response confirms feedback submission
        assert response.status_code == 200 or response.status_code == 201
        assert "sessionId" in response_data and response_data["sessionId"] == session_id
        assert "rating" in response_data and response_data["rating"] == 4.5
        assert "comment" in response_data and response_data["comment"] == "Great session, very informative!"
    finally:
        if session_id:
            delete_session(auth_token, session_id)

test_submit_session_feedback()