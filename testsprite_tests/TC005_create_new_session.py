import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30
PROXIES = {
    "http": "http://127.0.0.1:1080",
    "https": "http://127.0.0.1:1080",
}

def test_create_new_session():
    # Step 1: Login to get JWT token (using example valid credentials)
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }
    try:
        login_response = requests.post(login_url, json=login_payload, timeout=TIMEOUT, proxies=PROXIES)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"
        login_data = login_response.json()
        token = login_data.get("token") or login_data.get("accessToken")  # Accept common token keys
        assert token and isinstance(token, str), "Token missing or invalid in login response"
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Failed to authenticate user: {e}")

    # Step 2: Create new session using JWT token
    create_session_url = f"{BASE_URL}/api/sessions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    session_payload = {
        # Include realistic valid data for session creation
        "title": "Python Testing Session",
        "mentorId": "mentor123",
        "studentId": "student456",
        "scheduledTime": "2025-12-01T15:00:00Z",
        "durationMinutes": 60,
        "topic": "Testing APIs with Python"
    }

    created_session_id = None
    try:
        create_response = requests.post(create_session_url, json=session_payload, headers=headers, timeout=TIMEOUT, proxies=PROXIES)
        assert create_response.status_code == 201, f"Session creation failed with status {create_response.status_code}"
        session_data = create_response.json()
        created_session_id = session_data.get("id") or session_data.get("_id") or session_data.get("sessionId")
        assert created_session_id and isinstance(created_session_id, str), "Created session ID missing or invalid in response"

        # Additional assertions to verify returned session data matches sent data
        assert session_data.get("title") == session_payload["title"], "Session title mismatch"
        assert session_data.get("mentorId") == session_payload["mentorId"], "Mentor ID mismatch"
        assert session_data.get("studentId") == session_payload["studentId"], "Student ID mismatch"
        assert session_data.get("scheduledTime") == session_payload["scheduledTime"], "Scheduled time mismatch"
        assert session_data.get("durationMinutes") == session_payload["durationMinutes"], "Duration mismatch"
        assert session_data.get("topic") == session_payload["topic"], "Topic mismatch"

    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Failed to create new session: {e}")

    # Step 3: Cleanup - delete the created session
    if created_session_id:
        try:
            delete_url = f"{create_session_url}/{created_session_id}"
            delete_response = requests.delete(delete_url, headers=headers, timeout=TIMEOUT, proxies=PROXIES)
            assert delete_response.status_code in (200, 204), f"Failed to delete session, status {delete_response.status_code}"
        except requests.RequestException as e:
            print(f"Warning: could not delete test session {created_session_id}: {e}")

test_create_new_session()