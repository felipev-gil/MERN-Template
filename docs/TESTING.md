# Testing

## Isolated automated suite

From the project root, run `pnpm test`. No .env file, database, or Redis instance is required. The suite mocks database methods and Upstash while using real Express requests, validation, bcrypt, JWTs, and cookie handling.

It checks registration, normalization, invalid input, duplicate emails including write-time conflicts, login failures, session restoration, expired/tampered sessions, deleted users, logout, secure production cookies, origin protection, malformed/oversized bodies, safe errors, environment checks, and optional rate-limit behavior.

These tests do not execute MongoDB queries against a database or automate a browser. A passing suite does not replace the following checks.

## Manual application walkthrough

1. Follow the README setup with a development database and run pnpm dev.
2. Open localhost:5173. Confirm the home page and navigation fit both a phone-sized and desktop window.
3. Open /dashboard in a private browser window. Confirm it redirects to /login.
4. Register with a fresh email. Confirm the dashboard displays the submitted name and normalized email.
5. In the development database, confirm the stored password is a hash, never the original password.
6. Refresh /dashboard and confirm the session persists.
7. Log out. Confirm /dashboard redirects to login, including after a refresh.
8. Log in with a wrong password, then the correct one. Confirm useful error feedback and successful login.
9. Log out and register the same email again. Confirm the duplicate-account error.
10. Try invalid email, short password, whitespace-only name, and a password over 72 UTF-8 bytes. Confirm errors without creating accounts.
11. Delete the session cookie in browser tools and reload /dashboard. Confirm login is required.
12. Stop the API and reload /dashboard. Confirm a connection error with a Retry button; restart the API and retry.
13. Navigate using only the keyboard. Check visible focus, form labels, and the skip-to-content link.
14. Visit an unknown URL. Confirm the not-found page has a working home link.
15. Run pnpm build, then pnpm --filter frontend preview with the API running. Repeat login and refresh.

## Optional rate limiter

With a dedicated development Upstash instance, enable the limiter and make more than 10 valid-format login/register attempts in one minute from the same IP. Confirm 429 and Retry-After, then retry after the window resets. Confirm a service failure returns 503. The default automated suite covers these outcomes with mocks, without consuming a service quota.

## Deployment checks

Use HTTPS and same-site frontend/API URLs. Check Secure, HttpOnly, and SameSite=Lax on the session cookie; refresh a direct dashboard link; verify logout and protected API behavior. Confirm secrets are absent from frontend assets and the repository. The health endpoint reports HTTP liveness only.


## Session, readiness, and persistence regressions

The isolated suite checks version-based revocation, expiry metadata, dependency readiness and production rate-limit requirements. Run the separate `pnpm test:integration` suite using TEST_MONGO_URI and a dedicated `_test` database to exercise real persistence. Never use an application database. In two browser tabs, sign in and log out; confirm both dashboards clear. Confirm expiry clears the dashboard, protected API 401 responses invalidate the current session, and a failed login does not log out unrelated newer state. Disable a dependency and check /api/ready returns 503 without exposing connection details; /api/health remains liveness-only.
