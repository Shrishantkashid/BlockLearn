import requests

BASE_URL = "http://localhost:5000"
PROXY_URL = "http://localhost:5000"
TIMEOUT = 30

# Replace these credentials with valid test account credentials
TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "TestPassword123"

def test_get_user_sessions():
    session = requests.Session()
    session.proxies = {
        "http": PROXY_URL,
        "https": PROXY_URL,
    }
    try:
        # Step 1: Login to get JWT token
        login_url = f"{BASE_URL}/api/auth/login"
        login_payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        login_headers = {
            "Content-Type": "application/json"
        }
        login_response = session.post(login_url, json=login_payload, headers=login_headers, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed: {login_response.status_code} {login_response.text}"
        login_data = login_response.json()
        assert "token" in login_data, "JWT token not received in login response"
        token = login_data["token"]

        # Step 2: Use token to get sessions
        sessions_url = f"{BASE_URL}/api/sessions"
        sessions_headers = {
            "Authorization": f"Bearer {token}"
        }
        sessions_response = session.get(sessions_url, headers=sessions_headers, timeout=TIMEOUT)
        assert sessions_response.status_code == 200, f"Failed to get sessions: {sessions_response.status_code} {sessions_response.text}"

        sessions_data = sessions_response.json()
        assert isinstance(sessions_data, list), "Sessions response is not a list"

        # Validate each session object (basic validation)
        for session_obj in sessions_data:
            assert isinstance(session_obj, dict), "Session item is not an object"
            # Typical session fields might be id, mentorId, studentId, startTime, endTime etc.
            # Without exact schema, check for presence of 'id'
            assert "id" in session_obj, "Session object missing 'id' field"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_user_sessions()