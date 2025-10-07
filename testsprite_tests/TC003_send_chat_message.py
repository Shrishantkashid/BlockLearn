import requests

base_url = "http://localhost:5000"
timeout = 30
proxies = {
    "http": "http://localhost:1080",
    "https": "http://localhost:1080",
}

def test_send_chat_message():
    # First, create a new session to get a valid sessionId
    session_payload = {
        # Minimal payload for session creation; adjust keys as needed
        "title": "Test Session for Chat Message",
        "description": "Session created for testing chat message sending",
        "mentorId": "test-mentor-id",
        "studentId": "test-student-id"
    }
    session_id = None
    try:
        create_session_resp = requests.post(
            f"{base_url}/api/sessions",
            json=session_payload,
            timeout=timeout,
            proxies=proxies
        )
        assert create_session_resp.status_code == 201, f"Expected 201, got {create_session_resp.status_code}"
        session_json = create_session_resp.json()
        # Try to get sessionId from response assuming it's in 'id' or '_id'
        session_id = session_json.get("id") or session_json.get("_id")
        assert session_id is not None, "Session ID not found in create session response"

        # Now send chat message
        chat_message_payload = {
            "message": "Hello, this is a test chat message.",
            "sessionId": session_id
        }
        chat_resp = requests.post(
            f"{base_url}/api/chat/message",
            json=chat_message_payload,
            timeout=timeout,
            proxies=proxies
        )
        assert chat_resp.status_code == 200 or chat_resp.status_code == 201, \
            f"Expected 200 or 201, got {chat_resp.status_code}"

        chat_resp_json = chat_resp.json()
        # Validate response contains echoed message and sessionId
        assert "message" in chat_resp_json, "Response JSON missing 'message' field"
        assert "sessionId" in chat_resp_json, "Response JSON missing 'sessionId' field"
        assert chat_resp_json["message"] == chat_message_payload["message"], "Message text mismatch"
        assert chat_resp_json["sessionId"] == session_id, "SessionId mismatch in response"
    finally:
        # Clean up: delete the created session if possible
        if session_id:
            try:
                requests.delete(
                    f"{base_url}/api/sessions/{session_id}",
                    timeout=timeout,
                    proxies=proxies
                )
            except Exception:
                pass

test_send_chat_message()