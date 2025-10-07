
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** BlockLearn - Peer-to-Peer Learning Platform
- **Date:** 2025-10-05
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** user login functionality
- **Test Code:** [TC001_user_login_functionality.py](./TC001_user_login_functionality.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 26, in <module>
  File "<string>", line 20, in test_user_login_functionality
AssertionError: Expected status code 200, got 404

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/3070f817-5250-40af-8178-9980c95e90d0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** google oauth authentication
- **Test Code:** [TC002_google_oauth_authentication.py](./TC002_google_oauth_authentication.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 21, in <module>
  File "<string>", line 13, in test_google_oauth_authentication
AssertionError: Expected 200 OK but got 404

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/f275c103-91ee-43a3-9fe0-75f3a9528d9c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** send chat message
- **Test Code:** [TC003_send_chat_message.py](./TC003_send_chat_message.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/urllib3/connection.py", line 198, in _new_conn
    sock = connection.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/connection.py", line 85, in create_connection
    raise err
  File "/var/task/urllib3/util/connection.py", line 73, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 493, in _make_request
    conn.request(
  File "/var/task/urllib3/connection.py", line 494, in request
    self.endheaders()
  File "/var/lang/lib/python3.12/http/client.py", line 1333, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/var/lang/lib/python3.12/http/client.py", line 1093, in _send_output
    self.send(msg)
  File "/var/lang/lib/python3.12/http/client.py", line 1037, in send
    self.connect()
  File "/var/task/urllib3/connection.py", line 325, in connect
    self.sock = self._new_conn()
                ^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connection.py", line 213, in _new_conn
    raise NewConnectionError(
urllib3.exceptions.NewConnectionError: <urllib3.connection.HTTPConnection object at 0x7ffaed2fb710>: Failed to establish a new connection: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

urllib3.exceptions.ProxyError: ('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2fb710>: Failed to establish a new connection: [Errno 111] Connection refused'))

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/retry.py", line 519, in increment
    raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='localhost', port=1080): Max retries exceeded with url: http://localhost:5000/api/sessions (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2fb710>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 65, in <module>
  File "<string>", line 21, in test_send_chat_message
  File "/var/task/requests/api.py", line 115, in post
    return request("post", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/api.py", line 59, in request
    return session.request(method=method, url=url, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/adapters.py", line 694, in send
    raise ProxyError(e, request=request)
requests.exceptions.ProxyError: HTTPConnectionPool(host='localhost', port=1080): Max retries exceeded with url: http://localhost:5000/api/sessions (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2fb710>: Failed to establish a new connection: [Errno 111] Connection refused')))

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/12948c47-396c-4103-aa26-5201b1fad55e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** get user sessions
- **Test Code:** [TC004_get_user_sessions.py](./TC004_get_user_sessions.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/urllib3/connection.py", line 198, in _new_conn
    sock = connection.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/connection.py", line 85, in create_connection
    raise err
  File "/var/task/urllib3/util/connection.py", line 73, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 493, in _make_request
    conn.request(
  File "/var/task/urllib3/connection.py", line 494, in request
    self.endheaders()
  File "/var/lang/lib/python3.12/http/client.py", line 1333, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/var/lang/lib/python3.12/http/client.py", line 1093, in _send_output
    self.send(msg)
  File "/var/lang/lib/python3.12/http/client.py", line 1037, in send
    self.connect()
  File "/var/task/urllib3/connection.py", line 325, in connect
    self.sock = self._new_conn()
                ^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connection.py", line 213, in _new_conn
    raise NewConnectionError(
urllib3.exceptions.NewConnectionError: <urllib3.connection.HTTPConnection object at 0x7ffaed283020>: Failed to establish a new connection: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

urllib3.exceptions.ProxyError: ('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed283020>: Failed to establish a new connection: [Errno 111] Connection refused'))

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/retry.py", line 519, in increment
    raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='localhost', port=5000): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed283020>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<string>", line 27, in test_get_user_sessions
  File "/var/task/requests/sessions.py", line 637, in post
    return self.request("POST", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/adapters.py", line 694, in send
    raise ProxyError(e, request=request)
requests.exceptions.ProxyError: HTTPConnectionPool(host='localhost', port=5000): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed283020>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 54, in <module>
  File "<string>", line 52, in test_get_user_sessions
AssertionError: Request failed: HTTPConnectionPool(host='localhost', port=5000): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed283020>: Failed to establish a new connection: [Errno 111] Connection refused')))

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/090a038a-5276-49f7-be41-ded1d69f9b36
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** create new session
- **Test Code:** [TC005_create_new_session.py](./TC005_create_new_session.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/urllib3/connection.py", line 198, in _new_conn
    sock = connection.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/connection.py", line 85, in create_connection
    raise err
  File "/var/task/urllib3/util/connection.py", line 73, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 493, in _make_request
    conn.request(
  File "/var/task/urllib3/connection.py", line 494, in request
    self.endheaders()
  File "/var/lang/lib/python3.12/http/client.py", line 1333, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/var/lang/lib/python3.12/http/client.py", line 1093, in _send_output
    self.send(msg)
  File "/var/lang/lib/python3.12/http/client.py", line 1037, in send
    self.connect()
  File "/var/task/urllib3/connection.py", line 325, in connect
    self.sock = self._new_conn()
                ^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connection.py", line 213, in _new_conn
    raise NewConnectionError(
urllib3.exceptions.NewConnectionError: <urllib3.connection.HTTPConnection object at 0x7ffaed2921b0>: Failed to establish a new connection: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

urllib3.exceptions.ProxyError: ('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2921b0>: Failed to establish a new connection: [Errno 111] Connection refused'))

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/retry.py", line 519, in increment
    raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='127.0.0.1', port=1080): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2921b0>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<string>", line 18, in test_create_new_session
  File "/var/task/requests/api.py", line 115, in post
    return request("post", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/api.py", line 59, in request
    return session.request(method=method, url=url, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/adapters.py", line 694, in send
    raise ProxyError(e, request=request)
requests.exceptions.ProxyError: HTTPConnectionPool(host='127.0.0.1', port=1080): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2921b0>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 70, in <module>
  File "<string>", line 24, in test_create_new_session
AssertionError: Failed to authenticate user: HTTPConnectionPool(host='127.0.0.1', port=1080): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2921b0>: Failed to establish a new connection: [Errno 111] Connection refused')))

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/81c5c2f6-0e34-40b2-9413-cf3cb6fa71c3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** submit session feedback
- **Test Code:** [TC006_submit_session_feedback.py](./TC006_submit_session_feedback.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/urllib3/connection.py", line 198, in _new_conn
    sock = connection.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/connection.py", line 85, in create_connection
    raise err
  File "/var/task/urllib3/util/connection.py", line 73, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 493, in _make_request
    conn.request(
  File "/var/task/urllib3/connection.py", line 494, in request
    self.endheaders()
  File "/var/lang/lib/python3.12/http/client.py", line 1333, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/var/lang/lib/python3.12/http/client.py", line 1093, in _send_output
    self.send(msg)
  File "/var/lang/lib/python3.12/http/client.py", line 1037, in send
    self.connect()
  File "/var/task/urllib3/connection.py", line 325, in connect
    self.sock = self._new_conn()
                ^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connection.py", line 213, in _new_conn
    raise NewConnectionError(
urllib3.exceptions.NewConnectionError: <urllib3.connection.HTTPConnection object at 0x7ffaed293c80>: Failed to establish a new connection: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

urllib3.exceptions.ProxyError: ('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed293c80>: Failed to establish a new connection: [Errno 111] Connection refused'))

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/retry.py", line 519, in increment
    raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='localhost', port=5001): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed293c80>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 86, in <module>
  File "<string>", line 57, in test_submit_session_feedback
  File "<string>", line 17, in get_auth_token
  File "/var/task/requests/api.py", line 115, in post
    return request("post", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/api.py", line 59, in request
    return session.request(method=method, url=url, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/adapters.py", line 694, in send
    raise ProxyError(e, request=request)
requests.exceptions.ProxyError: HTTPConnectionPool(host='localhost', port=5001): Max retries exceeded with url: http://localhost:5000/api/auth/login (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed293c80>: Failed to establish a new connection: [Errno 111] Connection refused')))

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/11655e30-dd91-46ef-92d5-aaeb25be072d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** verify skill completion on blockchain
- **Test Code:** [TC007_verify_skill_completion_on_blockchain.py](./TC007_verify_skill_completion_on_blockchain.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/urllib3/connection.py", line 198, in _new_conn
    sock = connection.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/connection.py", line 85, in create_connection
    raise err
  File "/var/task/urllib3/util/connection.py", line 73, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/urllib3/connectionpool.py", line 787, in urlopen
    response = self._make_request(
               ^^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 493, in _make_request
    conn.request(
  File "/var/task/urllib3/connection.py", line 494, in request
    self.endheaders()
  File "/var/lang/lib/python3.12/http/client.py", line 1333, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/var/lang/lib/python3.12/http/client.py", line 1093, in _send_output
    self.send(msg)
  File "/var/lang/lib/python3.12/http/client.py", line 1037, in send
    self.connect()
  File "/var/task/urllib3/connection.py", line 325, in connect
    self.sock = self._new_conn()
                ^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/connection.py", line 213, in _new_conn
    raise NewConnectionError(
urllib3.exceptions.NewConnectionError: <urllib3.connection.HTTPConnection object at 0x7ffaed2f8c50>: Failed to establish a new connection: [Errno 111] Connection refused

The above exception was the direct cause of the following exception:

urllib3.exceptions.ProxyError: ('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2f8c50>: Failed to establish a new connection: [Errno 111] Connection refused'))

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/var/task/requests/adapters.py", line 667, in send
    resp = conn.urlopen(
           ^^^^^^^^^^^^^
  File "/var/task/urllib3/connectionpool.py", line 841, in urlopen
    retries = retries.increment(
              ^^^^^^^^^^^^^^^^^^
  File "/var/task/urllib3/util/retry.py", line 519, in increment
    raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='127.0.0.1', port=9322): Max retries exceeded with url: http://localhost:5000/api/blockchain/verify (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2f8c50>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "<string>", line 24, in test_verify_skill_completion_on_blockchain
  File "/var/task/requests/api.py", line 115, in post
    return request("post", url, data=data, json=json, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/api.py", line 59, in request
    return session.request(method=method, url=url, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 589, in request
    resp = self.send(prep, **send_kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/sessions.py", line 703, in send
    r = adapter.send(request, **kwargs)
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/var/task/requests/adapters.py", line 694, in send
    raise ProxyError(e, request=request)
requests.exceptions.ProxyError: HTTPConnectionPool(host='127.0.0.1', port=9322): Max retries exceeded with url: http://localhost:5000/api/blockchain/verify (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2f8c50>: Failed to establish a new connection: [Errno 111] Connection refused')))

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 39, in <module>
  File "<string>", line 27, in test_verify_skill_completion_on_blockchain
AssertionError: Request failed: HTTPConnectionPool(host='127.0.0.1', port=9322): Max retries exceeded with url: http://localhost:5000/api/blockchain/verify (Caused by ProxyError('Unable to connect to proxy', NewConnectionError('<urllib3.connection.HTTPConnection object at 0x7ffaed2f8c50>: Failed to establish a new connection: [Errno 111] Connection refused')))

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/c4d186c7-d7a5-4d32-a227-75a0f379b7cc/e5333dda-bcb3-4eb5-a8e4-9d46637a593c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---