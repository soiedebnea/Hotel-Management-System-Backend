/**
 * routes/bookings.js
 * Reservations, plus the check-in / check-out actions that move a
 * booking through its lifecycle and keep the linked room's status
 * in sync:
 *
 *   booked --check-in--> checked-in --check-out--> checked-out
 *      \-------------------- cancel --------------------/
 *
 * Room.status mirrors this: booking created -> room stays "available"
 * until check-in, then room becomes "occupied"; on check-out the room
 * goes back to "available".
 */
const express = require("express");
const store = require("../models/dataStore");

const router = express.Router();
const BOOKINGS = "bookings";
const ROOMS = "rooms";
const GUESTS = "guests";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function hydrate(booking) {
  const room = store.getById(ROOMS, booking.roomId);
  const guest = store.getById(GUESTS, booking.guestId);
  return {
    ...booking,
    room: room ? { id: room.id, number: room.number, type: room.type, rate: room.rate } : null,
    guest: guest ? { id: guest.id, name: guest.name, phone: guest.phone, email: guest.email } : null,
  };
}

// GET /api/bookings — list bookings (optional ?status=&roomId=&guestId=)
router.get("/", (req, res) => {
  let bookings = store.readAll(BOOKINGS);
  if (req.query.status) bookings = bookings.filter((b) => b.status === req.query.status);
  if (req.query.roomId) bookings = bookings.filter((b) => String(b.roomId) === req.query.roomId);
  if (req.query.guestId) bookings = bookings.filter((b) => String(b.guestId) === req.query.guestId);
  res.json(bookings.map(hydrate));
});

// GET /api/bookings/:id
router.get("/:id", (req, res) => {
  const booking = store.getById(BOOKINGS, req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(hydrate(booking));
});

// POST /api/bookings — create a reservation (does not occupy the room yet)
router.post("/", (req, res) => {
  const { roomId, guestId, checkInDate, checkOutDate, notes } = req.body;
  if (!roomId || !guestId || !checkInDate || !checkOutDate) {
    return res.status(400).json({ error: "roomId, guestId, checkInDate and checkOutDate are required" });
  }
  const room = store.getById(ROOMS, roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });
  const guest = store.getById(GUESTS, guestId);
  if (!guest) return res.status(404).json({ error: "Guest not found" });

  const newStart = new Date(checkInDate).getTime();
  const newEnd = new Date(checkOutDate).getTime();
  if (!(newStart < newEnd)) {
    return res.status(400).json({ error: "checkOutDate must be after checkInDate" });
  }

  const existing = store.readAll(BOOKINGS).filter(
    (b) => String(b.roomId) === String(roomId) && b.status !== "cancelled" && b.status !== "checked-out"
  );
  const clashes = existing.some((b) =>
    overlaps(newStart, newEnd, new Date(b.checkInDate).getTime(), new Date(b.checkOutDate).getTime())
  );
  if (clashes) {
    return res.status(409).json({ error: "Room is already booked for those dates" });
  }

  const booking = store.insert(BOOKINGS, {
    roomId,
    guestId,
    checkInDate,
    checkOutDate,
    status: "booked", // booked | checked-in | checked-out | cancelled
    notes: notes ?? "",
    actualCheckIn: null,
    actualCheckOut: null,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(hydrate(booking));
});

// PUT /api/bookings/:id — edit dates/notes on a booking that hasn't checked in yet
router.put("/:id", (req, res) => {
  const booking = store.getById(BOOKINGS, req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status === "checked-in" || booking.status === "checked-out") {
    return res.status(400).json({ error: `Cannot edit a booking that is already ${booking.status}` });
  }
  const updated = store.update(BOOKINGS, req.params.id, req.body);
  res.json(hydrate(updated));
});

// POST /api/bookings/:id/checkin — guest arrives, room becomes occupied
router.post("/:id/checkin", (req, res) => {
  const booking = store.getById(BOOKINGS, req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "booked") {
    return res.status(400).json({ error: `Booking is ${booking.status}, cannot check in` });
  }
  const room = store.getById(ROOMS, booking.roomId);
  if (room && room.status === "maintenance") {
    return res.status(400).json({ error: "Room is under maintenance and cannot be occupied" });
  }

  const updated = store.update(BOOKINGS, req.params.id, {
    status: "checked-in",
    actualCheckIn: new Date().toISOString(),
  });
  store.update(ROOMS, booking.roomId, { status: "occupied" });
  res.json(hydrate(updated));
});

// POST /api/bookings/:id/checkout — guest leaves, room becomes available again
router.post("/:id/checkout", (req, res) => {
  const booking = store.getById(BOOKINGS, req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "checked-in") {
    return res.status(400).json({ error: `Booking is ${booking.status}, cannot check out` });
  }

  const updated = store.update(BOOKINGS, req.params.id, {
    status: "checked-out",
    actualCheckOut: new Date().toISOString(),
  });
  store.update(ROOMS, booking.roomId, { status: "available" });
  res.json(hydrate(updated));
});

// POST /api/bookings/:id/cancel — cancel a reservation that hasn't checked in
router.post("/:id/cancel", (req, res) => {
  const booking = store.getById(BOOKINGS, req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "booked") {
    return res.status(400).json({ error: `Booking is ${booking.status}, cannot cancel` });
  }
  const updated = store.update(BOOKINGS, req.params.id, { status: "cancelled" });
  res.json(hydrate(updated));
});

// DELETE /api/bookings/:id
router.delete("/:id", (req, res) => {
  const ok = store.remove(BOOKINGS, req.params.id);
  if (!ok) return res.status(404).json({ error: "Booking not found" });
  res.status(204).end();
});

module.exports = router;