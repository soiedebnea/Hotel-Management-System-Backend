# Hotel Management System — Backend

A REST API for rooms, guests, bookings, and check-in / check-out, built with
**Node.js + Express**. Data is persisted to local **JSON files** — no
database server to install.

## Setup

```bash
cd backend
npm install
npm run seed     # optional — loads demo rooms/guests/bookings
npm start        # runs on http://localhost:5000
```

Use `npm run dev` instead of `npm start` to auto-restart on file changes
(uses Node's built-in `--watch`, Node 18.11+).

## File & folder management

```
backend/
├── server.js            # App entry point: creates the Express app,
│                         # mounts routes, starts the HTTP server.
├── package.json          # Dependencies (express, cors) and npm scripts.
├── models/
│   └── dataStore.js      # Generic JSON file read/write layer. Every
│                         # route calls readAll / insert / update / remove
│                         # here instead of touching files directly —
│                         # this is the only file that knows about the
│                         # on-disk format, so the storage engine can be
│                         # swapped for a real database later without
│                         # changing any route.
├── routes/
│   ├── rooms.js          # /api/rooms      — CRUD + status filtering
│   ├── guests.js         # /api/guests     — CRUD + search
│   └── bookings.js       # /api/bookings   — CRUD + /checkin /checkout
│                         # /cancel actions and date-overlap validation
├── utils/
│   └── seed.js           # Resets data/*.json with demo records.
│                         # Run with `npm run seed`.
└── data/                 # Created automatically on first run.
    ├── rooms.json         # One JSON array per "table" — this is the
    ├── guests.json        # entire database. Back it up by copying this
    └── bookings.json      # folder; reset it by deleting the files (they
                            # are recreated empty on the next request).
```

**How a request flows:** `server.js` → `routes/*.js` (validation +
business rules, e.g. blocking a check-in on a room under maintenance) →
`models/dataStore.js` (reads/writes the matching file in `data/`) →
response back to the route.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/rooms` | List rooms (`?status=`, `?type=`) |
| POST | `/api/rooms` | Create room |
| GET/PUT/DELETE | `/api/rooms/:id` | Read / update / delete a room |
| GET | `/api/guests` | List guests (`?search=`) |
| POST | `/api/guests` | Create guest |
| GET/PUT/DELETE | `/api/guests/:id` | Read / update / delete a guest |
| GET | `/api/bookings` | List bookings (`?status=`, `?roomId=`, `?guestId=`) |
| POST | `/api/bookings` | Create a reservation (validates dates + room availability) |
| GET/PUT/DELETE | `/api/bookings/:id` | Read / update / delete a booking |
| POST | `/api/bookings/:id/checkin` | Check a guest in — room status → `occupied` |
| POST | `/api/bookings/:id/checkout` | Check a guest out — room status → `available` |
| POST | `/api/bookings/:id/cancel` | Cancel a booking that hasn't checked in |

### Booking lifecycle

```
booked ──check-in──▶ checked-in ──check-out──▶ checked-out
   └───────────────────cancel──────────────────┘
```

The room's `status` field (`available` / `occupied` / `maintenance`) is
updated automatically by the check-in and check-out endpoints, and can be
set to `maintenance` manually via `PUT /api/rooms/:id`.

## Notes

- CORS is open (`app.use(cors())`) so the plain frontend can call the API
  from `file://` or any local dev server during development. Restrict this
  in `server.js` before deploying publicly.
- Port defaults to `5000`; override with `PORT=xxxx npm start`.
