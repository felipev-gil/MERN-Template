# MERN Template

A small MongoDB, Express, React, and Node.js starter with registration, login, a protected dashboard, and a beginner-friendly project structure.

## Included

- React and Vite frontend with React Router, Axios, Tailwind CSS, DaisyUI, and React Hot Toast.
- Express API with Mongoose, input validation, password hashing, and one-hour JWT sessions in HTTP-only cookies.
- Upstash authentication rate limiting is required in production and optional locally.
- Jest and Supertest tests that require no database or external service.
- One pnpm workspace and lockfile for frontend and backend.

This starter intentionally has no roles, refresh tokens, password reset, email verification, CRUD example, or deployment automation.

## Prerequisites

- Node.js 24.20 or later within the 24.x release line.
- pnpm 11.25 or later (the packageManager field records the intended version).
- A running MongoDB database for the application. Tests do not need one.

## Quick start

Clone your copy of this repository and open its folder in a terminal. All commands below run from that folder unless stated otherwise.

### 1. Install dependencies

```sh
pnpm install
```

### 2. Create environment files

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

macOS/Linux:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Generate a random secret with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the result into `JWT_SECRET` in `backend/.env`. The example placeholder is intentionally rejected at startup. Never commit a real secret.

### 3. Configure the database

Use a running local MongoDB instance or an existing MongoDB Atlas database. Set `MONGO_URI` to its connection string. For Atlas, configure a database user and allow your development IP in network access. URL-encode special characters in connection-string passwords.

The local example uses `mongodb://127.0.0.1:27017/mern_template`. Mongoose creates the collection and unique email index when the backend starts. No separate setup command is needed.

### 4. Start both applications

```sh
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs on port 5000; [its health endpoint](http://localhost:5000/api/health) returns `{"status":"ok"}`. Health checks HTTP availability. GET /api/ready checks the database and enabled Redis dependency with a three-second deadline, returning 200 or 503.

Use `localhost` consistently: mixing it with `127.0.0.1` in browser/API URLs can prevent cookies from working. Stop development servers with Ctrl+C.

### 5. Try authentication

1. Select **Create an account**, enter a name, email, and password, and submit.
2. The dashboard displays the account's name and email.
3. Refresh the page: the frontend restores the session through `GET /api/auth/me`.
4. Log out, then visit `/dashboard`: you should be redirected to login.
5. Log back in with the same credentials.

Passwords require at least eight characters and at most 72 UTF-8 bytes. Passwords are not trimmed. Email addresses are trimmed and lowercased.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run both development servers |
| `pnpm dev:frontend` | Run only Vite |
| `pnpm dev:backend` | Run only the API, restarting on changes |
| `pnpm build` | Build the frontend into frontend/dist |
| `pnpm start` | Start the backend |
| `pnpm test` | Run isolated backend tests |
| `pnpm --filter frontend preview` | Preview the built frontend locally |

`pnpm start` does not serve the frontend. Vite preview is for local inspection, not a production hosting server.

## Folder guide

```text
MERN-Template/
├── backend/
│   ├── index.js           # Startup and graceful shutdown
│   ├── .env.example
│   └── src/
│       ├── app.js         # Express configuration, without listening
│       ├── config/        # Environment and database connection
│       ├── controllers/   # Request handlers
│       ├── middlewares/   # Authentication, rate limits, errors
│       ├── models/        # Mongoose User schema and queries
│       ├── routes/        # URL-to-controller mapping
│       ├── validators/    # Input rules
│       ├── utils/         # Session cookie helpers
│       └── tests/         # Isolated API/configuration tests
├── frontend/
│   ├── .env.example
│   ├── vite.config.js     # Vite and styling configuration
│   └── src/
│       ├── components/    # Layout, loading, protected route
│       ├── context/       # Authentication state
│       ├── pages/         # Home, auth, dashboard, not found
│       ├── services/      # Axios instance and API error helper
│       ├── App.jsx        # Route definitions
│       ├── main.jsx       # React entry and providers
│       └── index.css      # Tailwind directives and base styles
├── docs/TESTING.md
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

Keep small features in these existing folders. Add new folders only when they solve a real organizational problem. Backend files use CommonJS (`require`); frontend files use ES modules (`import`).

## How authentication works

The form sends JSON through the Axios instance. Express checks the request origin and validates the fields. Registration hashes the password with bcrypt before saving the user. Login compares the supplied password against that hash.

The API signs a JWT containing the user ID and sets a one-hour HTTP-only cookie. JavaScript cannot read this cookie; the browser sends it on requests because Axios uses `withCredentials`. No token is stored in localStorage. On page load, AuthContext calls `/auth/me` to recover the public profile.

ProtectedRoute controls the frontend navigation experience. The backend's `requireAuth` middleware enforces access independently, verifying the JWT and looking up the user. Apply that middleware to every future private API route.

Logout revokes every existing session for the account by incrementing its database session version, then clears the mern_session cookie. Copied tokens with an older version are rejected. Sessions expire after one hour without automatic renewal. The frontend clears expired sessions, handles protected-response 401 errors, rechecks on window focus, and synchronizes account changes through BroadcastChannel when supported.

Cookies use SameSite=Lax and Secure in production. Write requests must carry an Origin header matching CLIENT_ORIGIN, including command-line API requests. This check protects cookie-based writes against cross-origin requests; CORS alone is not a substitute.

## API reference

| Method and path | Request | Result |
| --- | --- | --- |
| POST /api/auth/register | name, email, password | 201, public user and sessionExpiresAt; session cookie |
| POST /api/auth/login | email, password | 200, public user and sessionExpiresAt; session cookie |
| POST /api/auth/logout | No body needed | 204; expired cookie |
| GET /api/auth/me | Session cookie | 200 and public user, or 401 |
| GET /api/health | None | 200 and liveness status |
| GET /api/ready | None | 200 ready or 503 unavailable |

User responses use `{ user: { id, name, email, createdAt } }`. Errors use `{ message }`; validation errors also include `errors: [{ field, message }]`. Password hashes and tokens are never included in JSON responses.

## Environment reference

| Variable | Meaning |
| --- | --- |
| NODE_ENV | development, test, or production |
| PORT | Backend port; default 5000 |
| CLIENT_ORIGIN | Exact frontend origin, without a path or trailing slash |
| JWT_SECRET | Random signing secret, at least 32 characters |
| MONGO_URI | Database connection string |
| RATE_LIMIT_ENABLED | true or false; default false |
| UPSTASH_REDIS_REST_URL | Required only when rate limiting is enabled |
| UPSTASH_REDIS_REST_TOKEN | Required only when rate limiting is enabled |
| TRUST_PROXY_HOPS | Verified proxy hop count; default 0 |
| VITE_API_URL | Public frontend API base URL, including /api |

Only VITE_API_URL belongs in frontend/.env. **Every VITE_ variable is public:** Vite embeds it in the browser bundle. Restart development servers after changing environment values, and rebuild the frontend after changing a production API URL.

## Rate limiting

Set RATE_LIMIT_ENABLED=true and supply both Upstash values to limit registration and login to a combined 10 attempts per IP per minute. Requests beyond the limit receive 429 and Retry-After. A limiter timeout or service failure returns 503 instead of silently allowing attempts.

Disabled mode creates no Redis connection and is accepted only outside production. Production startup requires RATE_LIMIT_ENABLED=true and valid Upstash credentials. Behind a proxy, follow your host's routing documentation before setting TRUST_PROXY_HOPS: trusting arbitrary forwarded addresses allows clients to evade IP limits.

## Frontend configuration

This template uses Tailwind CSS 3 and DaisyUI 4 so Tailwind can run directly through Vite's PostCSS support without an additional integration package. These major versions are intentional; do not upgrade one styling package independently. See the [Tailwind 3 documentation](https://v3.tailwindcss.com/docs/installation/using-postcss) and [DaisyUI 4 documentation](https://v4.daisyui.com/docs/install/).

Vite handles JSX without an extra React plugin. Basic module reload is available; React Fast Refresh is not configured. There is no separate linting package or formatter requirement.

## Tests

Run `pnpm test`. Tests exercise Express requests, validation, real password hashing, JWT verification, cookies, and error responses. Database methods and Upstash calls are mocked. They do not verify actual database connectivity, persistence, or a browser session. Follow [the testing guide](docs/TESTING.md) for the manual application flow.

## Troubleshooting

- **API will not start:** check the required backend variables and database availability. Ensure JWT_SECRET is not the placeholder.
- **Database connection fails:** check credentials, host, port, network rules, and connection-string escaping.
- **Login succeeds but the session disappears:** use localhost consistently, check withCredentials, and confirm frontend/backend URLs are on the same site.
- **403 origin error:** CLIENT_ORIGIN must match the actual browser origin exactly. API tools must also send that Origin header on writes.
- **Port already in use:** stop the other server or update the port and matching environment URLs. Vite uses a strict port to avoid silently breaking CORS.
- **Rate limiter returns 503:** check the Upstash connection and credentials. For local work without Upstash, disable RATE_LIMIT_ENABLED.
- **A deployed route returns the host's 404 on refresh:** configure the static host to serve index.html for frontend routes.
- **Styles are missing:** keep Tailwind 3 and DaisyUI 4 together, and keep class names statically discoverable in JSX.

## Production basics

Host the built frontend and the Node API separately, with HTTPS. This cookie configuration expects **same-site** deployment, for example app.example.com and api.example.com, or a same-origin reverse proxy. Unrelated frontend/API hosting domains do not work with SameSite=Lax; keep this starter's supported same-site topology.

Set NODE_ENV=production, a fresh strong JWT_SECRET, the exact HTTPS CLIENT_ORIGIN, and the production database connection. Set VITE_API_URL before building. Configure frontend route fallback, enable rate limiting, and verify trusted proxy settings. Use a dedicated database account with the permissions your application requires. This starter is a foundation; add account recovery and other product-specific requirements before relying on it for a full user-facing service.


## Database integration tests

Run `pnpm test:integration` with `TEST_MONGO_URI` set to a separate database whose name ends in `_test`. The suite refuses the configured application database name. It checks actual persistence, unique email constraints, password hashes, authentication, readiness and revoked-token rejection. It removes only its uniquely named test accounts. Default `pnpm test` continues to run without external services.


## License

This project is licensed under the [MIT License](LICENSE). Third-party dependencies, bundled assets, and data retain their respective licenses and terms.
