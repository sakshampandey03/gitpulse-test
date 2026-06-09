# Severity Classification Guide

## Critical
Directly exploitable with immediate, severe impact. No special conditions required.
- Hardcoded credentials in source code
- SQL injection with no sanitization
- Authentication bypass
- Remote code execution vectors

## High
Exploitable under realistic conditions. Significant data or system impact.
- Missing authorization on sensitive endpoints
- Weak password hashing (MD5/SHA1)
- User input passed to shell commands with minimal filtering
- Sensitive data (tokens, PII) written to logs

## Medium
Exploitable but requires specific conditions or has limited impact scope.
- Missing rate limiting on login endpoints
- Verbose error messages with internal paths
- Insecure direct object references with partial controls

## Low
Best practice violation or low-probability exploit with minimal impact.
- Missing security headers
- Overly broad CORS policy on non-sensitive endpoints
- Minor information disclosure
