import secrets
import hashlib
import hmac

def generate_secure_token() -> str:
    """Generates a cryptographically random raw token."""
    return secrets.token_urlsafe(32)

def hash_token(raw_token: str) -> str:
    """Hashes a raw token using SHA-256 before database storage."""
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

def verify_token_hash(raw_token: str, stored_hash: str) -> bool:
    """Compares a raw token with a stored hash using constant-time comparison to prevent timing attacks."""
    if not raw_token or not stored_hash:
        return False
    computed_hash = hash_token(raw_token)
    return hmac.compare_digest(computed_hash, stored_hash)
