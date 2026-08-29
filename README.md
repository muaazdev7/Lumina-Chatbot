# Lumina

An AI chat and image-generation web app with a credit-based billing system. Users sign up, chat with a Gemini-powered assistant, generate images, publish them to a public gallery, and buy credits through Stripe Checkout.

A React 19 single-page app (`client/`) talking to an Express 5 REST API (`server/`) backed by MongoDB.

## Features

- **Accounts** — register, login, logout with JWT sessions that survive a page reload
- **Multiple chats** — create, switch, search and delete conversations, each with its own message history
- **Text generation** — replies from Google Gemini, rendered as Markdown with syntax-highlighted code
- **Image generation** — prompts rendered by ImageKit and stored in your media library
- **Community gallery** — images generated with "Publish" enabled appear publicly, credited to their author
- **Credits** — 20 free on signup; text costs 1, images cost 2. Balance updates live in the sidebar.
- **Stripe Checkout** — three credit packs, fulfilled by a webhook
- **Light / dark theme** — persisted to `localStorage`

## Tech stack

**Frontend** — React 19, React Router 7, Tailwind CSS 4, Vite 8, axios, react-markdown, PrismJS, react-hot-toast, moment

**Backend** — Node.js, Express 5, MongoDB with Mongoose 9, JWT (`jsonwebtoken`), bcrypt, the OpenAI SDK pointed at Gemini, ImageKit, Stripe

## Project structure

```
Lumina/
├── .gitignore
├── README.md
├── client/                     # React SPA
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js          # dev server pinned to port 5173
│   └── src/
│       ├── main.jsx            # entry
│       ├── App.jsx             # auth gate and routes
│       ├── assets/             # icons and images
│       ├── context/            # AppContext - user, chats, theme
│       ├── services/           # axios instance + one module per API area
│       ├── components/         # Sidebar, Chatbox, Message
│       └── pages/              # Login, Credits, Community, Loading
└── server/                     # Express REST API
    ├── .env.example
    ├── server.js               # bootstrap, CORS, routes
    ├── configs/                # db, openAi, imageKit, allowedOrigins
    ├── middlewares/auth.js     # JWT verification
    ├── models/                 # User, Chat, Transaction
    ├── controllers/            # user, chat, message, credit, webhooks
    └── routes/                 # route definitions
```

## Prerequisites

- Node.js 20+ and npm
- MongoDB (Atlas cluster or local instance)
- A Google Gemini API key
- An ImageKit account (required for image generation)
- A Stripe account in test mode (required for buying credits)

## Installation

Clone the repository, then install dependencies for each app.

**Server**

```bash
cd server
npm install
```

**Client**

```bash
cd client
npm install
```

## Environment variables

Both apps ship a `.env.example`. Copy each to `.env` and fill in your own values — `.env` files are gitignored and must never be committed.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### `server/.env`

| Variable | Required | Notes |
|---|---|---|
| `PORT` | no | Defaults to `3000` |
| `NODE_ENV` | no | `development` or `production` |
| `CLIENT_URL` | **yes** | Comma-separated frontend origins allowed by CORS |
| `MONGO_URI` | **yes** | MongoDB connection string |
| `MONGO_DB_NAME` | no | Defaults to `lumina` |
| `JWT_SECRET` | **yes** | Long random string (see below) |
| `JWT_EXPIRE` | no | Defaults to `7d` |
| `GEMINI_API_KEY` | **yes** | Google Gemini API key |
| `GEMINI_BASE_URL` | no | Gemini's OpenAI-compatible endpoint |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.6-flash` |
| `IMAGEKIT_PUBLIC_KEY` | **yes** | |
| `IMAGEKIT_PRIVATE_KEY` | **yes** | |
| `IMAGEKIT_URL_ENDPOINT` | **yes** | |
| `IMAGE_GEN_MAX_ATTEMPTS` | no | Polls while an image renders. Defaults to `60`. |
| `IMAGE_GEN_POLL_MS` | no | Defaults to `3000` |
| `STRIPE_SECRET_KEY` | for billing | |
| `STRIPE_WEBHOOK_SECRET` | for billing | Signing secret for the webhook endpoint |
| `STRIPE_PUBLISHABLE_KEY` | no | Stored for reference; the current flow does not use it |

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### `client/.env`

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | **yes** | API base URL, e.g. `http://localhost:3000`. No trailing slash and no `/api` suffix. |

Only `VITE_`-prefixed variables reach the browser, and anything here is publicly visible in the built bundle. Never put a secret in the client environment.

## Running the project

Run both apps at the same time, in two terminals.

**Terminal 1 — server**

```bash
cd server
npm run server     # nodemon, restarts on changes
# or: npm start    # plain node
```

You should see `Database Connected` and `Server is running on port 3000`.

**Terminal 2 — client**

```bash
cd client
npm run dev
```

Open <http://localhost:5173>.

Other client scripts: `npm run build` (production build into `dist/`), `npm run preview` (serve the build on port 4173), `npm run lint`.

## Setup notes

- **`CLIENT_URL` must contain the exact frontend origin**, or every request fails CORS. The default covers `http://localhost:5173` and `http://localhost:4173`.
- **The Vite dev port is pinned to 5173** (`strictPort`). If it is taken, Vite fails rather than silently moving to another port that CORS would reject.
- **Stripe webhooks must be forwarded locally**, or credits will never be granted after payment:

  ```bash
  stripe listen --forward-to localhost:3000/api/stripe
  ```

  Put the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET` and restart the server.
- **Image generation takes 20–90 seconds.** ImageKit renders asynchronously and the server polls until the image is ready.
- **Tailwind v4 is configured in `client/src/index.css`**, not a `tailwind.config.js`.

## API overview

All routes are prefixed with `/api`. Protected routes need an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/user/register` | — | Create an account |
| POST | `/user/login` | — | Log in |
| GET | `/user/data` | ✅ | Current user |
| GET | `/user/published-images` | — | Community gallery |
| POST | `/chat/create` | ✅ | New chat |
| GET | `/chat/get` | ✅ | List chats |
| POST | `/chat/delete` | ✅ | Delete a chat |
| POST | `/message/text` | ✅ | Text generation (1 credit) |
| POST | `/message/image` | ✅ | Image generation (2 credits) |
| GET | `/credit/plan` | — | Available credit plans |
| POST | `/credit/purchase` | ✅ | Start Stripe Checkout |
| POST | `/stripe` | Stripe | Webhook endpoint |

Errors return a matching HTTP status with `{ "success": false, "message": "..." }`.

## Deployment

The two apps deploy separately.

- **Server** — any Node host. Start with `npm start`, set every required variable in the host's secret manager (do not deploy a `.env` file), point `CLIENT_URL` at the deployed frontend, and register `https://your-api/api/stripe` as a Stripe webhook endpoint.
- **Client** — any static host. Build with `npm run build`, publish `dist/`, set `VITE_API_URL` at build time (Vite inlines it), and add an SPA rewrite so `/credits`, `/community` and `/loading` fall back to `index.html`.
