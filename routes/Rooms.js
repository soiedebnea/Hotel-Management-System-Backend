/**
 * routes/rooms.js
 * Room inventory: list, create, update, delete rooms.
 * Room.status is one of: "available" | "occupied" | "maintenance"
 * and is kept in sync automatically by the bookings routes on
 * check-in / check-out.
 */
const express = require("express");
const store = require("../models/dataStore");

const router = express.Router();
const COLLECTION = "rooms";

// GET /api/rooms — list all rooms (optional ?status=&type=)
router.get("/", (req, res) => {
  let rooms = store.readAll(COLLECTION);
  if (req.query.status) rooms = rooms.filter((r) => r.status === req.query.status);
  if (req.query.type) {
    rooms = rooms.filter((r) => r.type.toLowerCase() === String(req.query.type).toLowerCase());
  }
  res.json(rooms);
});

// GET /api/rooms/:id
router.get("/:id", (req, res) => {
  const room = store.getById(COLLECTION, req.params.id);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

// POST /api/rooms — create a room
router.post("/", (req, res) => {
  const { number, type, rate, floor, capacity, amenities } = req.body;
  if (!number || !type || rate == null) {
    return res.status(400).json({ error: "number, type and rate are required" });
  }
  const rooms = store.readAll(COLLECTION);
  if (rooms.some((r) => String(r.number) === String(number))) {
    return res.status(409).json({ error: `Room ${number} already exists` });
  }
  const room = store.insert(COLLECTION, {
    number,
    type,
    rate: Number(rate),
    floor: floor ?? null,
    capacity: capacity ?? 2,
    amenities: amenities ?? [],
    status: "available",
  });
  res.status(201).json(room);
});

// PUT /api/rooms/:id — update room details or status (e.g. put into maintenance)
router.put("/:id", (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Room not found" });
  res.json(updated);
});

// DELETE /api/rooms/:id
router.delete("/:id", (req, res) => {
  const ok = store.remove(COLLECTION, req.params.id);
  if (!ok) return res.status(404).json({ error: "Room not found" });
  res.status(204).end();
});

module.exports = router;