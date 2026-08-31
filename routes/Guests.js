/**
 * routes/guests.js
 * Guest records: contact info + ID document, independent of any one stay.
 */
const express = require("express");
const store = require("../models/dataStore");

const router = express.Router();
const COLLECTION = "guests";

// GET /api/guests — list all guests (optional ?search= matches name/email/phone)
router.get("/", (req, res) => {
  let guests = store.readAll(COLLECTION);
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    guests = guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.email || "").toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q)
    );
  }
  res.json(guests);
});

// GET /api/guests/:id
router.get("/:id", (req, res) => {
  const guest = store.getById(COLLECTION, req.params.id);
  if (!guest) return res.status(404).json({ error: "Guest not found" });
  res.json(guest);
});

// POST /api/guests — create a guest record
router.post("/", (req, res) => {
  const { name, email, phone, idType, idNumber, address } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "name and phone are required" });
  }
  const guest = store.insert(COLLECTION, {
    name,
    email: email ?? "",
    phone,
    idType: idType ?? "",
    idNumber: idNumber ?? "",
    address: address ?? "",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(guest);
});

// PUT /api/guests/:id — update guest details
router.put("/:id", (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Guest not found" });
  res.json(updated);
});

// DELETE /api/guests/:id
router.delete("/:id", (req, res) => {
  const ok = store.remove(COLLECTION, req.params.id);
  if (!ok) return res.status(404).json({ error: "Guest not found" });
  res.status(204).end();
});

module.exports = router;