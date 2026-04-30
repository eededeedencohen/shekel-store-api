# Shekel Store Contract — API

Node/Express + MongoDB backend for the Shekel store digital-contract system.
Serves the REST API and the bundled client SPA from a single process.

## Stack

- **Node.js** (≥ 18) + **Express 4**
- **MongoDB** via **Mongoose 8**
- JWT auth for the admin area
- Multer for image uploads (stored as binary in MongoDB, not on disk)

## Layout

```
server/
├─ app.js                  Express app, middleware, route mounting, SPA fallback
├─ server.js               Entry point: connects to Mongo and starts the server
├─ config.env              Environment variables (gitignored — copy from example)
├─ config.env.example      Reference template
├─ controllers/            Route handlers (auth, contracts, signatures, images)
├─ models/                 Mongoose schemas
├─ routes/                 Express routers, one per resource
├─ utils/                  appError, catchAsync, getClientIp
├─ scripts/                seedAdmin, smoke test
├─ public/                 Legacy static (kept for backwards compat)
└─ dist/                   Built client SPA (served at /)
```

## Setup

```bash
npm install
cp config.env.example config.env   # then fill in the values
npm run seed:admin                  # create the admin user once
npm run dev                         # nodemon, auto-reloads on file changes
```

Production:
```bash
npm start                           # plain node, no auto-reload
```

## Environment variables

| Var | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | HTTP port (default 5000) |
| `DATABASE` | Mongo connection string with `<PASSWORD>` placeholder |
| `DATABASE_PASSWORD` | substituted into `DATABASE` |
| `JWT_SECRET` | signing key for admin tokens |
| `JWT_EXPIRES_IN` | token lifetime (e.g. `90d`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | seed credentials for `npm run seed:admin` |

## API surface

All endpoints are under `/api/v1`.

- `POST   /auth/login`
- `GET    /contracts`                       *(admin)*
- `POST   /contracts`                       *(admin)*
- `GET    /contracts/:id`                   *(admin)*
- `PATCH  /contracts/:id`                   *(admin)*
- `DELETE /contracts/:id`                   *(admin, cascades signatures+images)*
- `PATCH  /contracts/:id/publish`           *(admin)*
- `PATCH  /contracts/:id/unpublish`         *(admin)*
- `GET    /contracts/share/:token`          *(public — returns contract + existing signature if any)*
- `GET    /signatures`                      *(admin, optional `?contractId=`)*
- `GET    /signatures/:id`                  *(admin)*
- `DELETE /signatures/:id`                  *(admin)*
- `POST   /signatures/share/:token`         *(public — rejects 409 if already signed)*
- `GET    /signatures/share/:token/check`   *(public)*
- `POST   /signatures/share/:token/verify`  *(public)*
- `POST   /images/upload`                   *(admin)*
- `POST   /images/upload-signature`         *(public)*
- `GET    /images/:filename`                *(public)*

## SPA hosting

The Express app statically serves `dist/` and falls back to `dist/index.html`
for non-API routes, so the same origin handles both API calls and the React
client.
