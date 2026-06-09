# OWASP Top 10 Checklist

## A01 - Broken Access Control
- Missing authorization checks before sensitive operations
- Insecure direct object references (user can access other users' data by changing an ID)
- CORS misconfiguration allowing unauthorized origins
- Privilege escalation paths

## A02 - Cryptographic Failures
- Sensitive data transmitted over HTTP (not HTTPS)
- Weak hashing algorithms (MD5, SHA1) used for passwords
- Hardcoded encryption keys or IVs
- Unencrypted sensitive data stored in files or databases

## A03 - Injection
- SQL injection: string concatenation or template literals used to build queries
- Command injection: user input passed to shell/exec functions
- LDAP, XPath, NoSQL injection patterns
- Template injection

## A04 - Insecure Design
- Missing rate limiting on sensitive endpoints
- No input validation before processing
- Secrets returned in API responses unnecessarily

## A05 - Security Misconfiguration
- Verbose error messages exposing stack traces or internal paths
- Default credentials left unchanged
- Unnecessary features or endpoints enabled
- Missing security headers

## A06 - Vulnerable and Outdated Components
- Imports from known vulnerable packages
- Version pins on packages with known CVEs

## A07 - Identification and Authentication Failures
- Hardcoded credentials (passwords, API keys, tokens) in source code
- Weak or missing token expiry
- Passwords stored in plaintext or reversibly encoded
- Missing brute-force protection

## A08 - Software and Data Integrity Failures
- Untrusted data deserialized without validation
- Auto-update mechanisms without integrity checks

## A09 - Security Logging and Monitoring Failures
- Passwords or tokens logged to console or files
- PII (emails, names, SSNs) written to logs
- No audit trail for sensitive operations

## A10 - Server-Side Request Forgery (SSRF)
- User-controlled URLs passed to HTTP client functions
- Missing allowlist for internal URL fetching
