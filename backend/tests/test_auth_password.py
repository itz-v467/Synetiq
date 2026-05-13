from backend.app.core.security import hash_password, verify_password


def test_password_hash_roundtrip():
    hashed = hash_password("supersecret123")
    assert verify_password("supersecret123", hashed) is True
    assert verify_password("wrongpassword", hashed) is False
