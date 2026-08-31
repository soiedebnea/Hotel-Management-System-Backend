/**
 * server.js — entry point for the Hotel Management System API.
 *
 * Run with:  npm install && npm start
 * Server listens on http://localhost:5000 by default (set PORT to change).
 */
const express = require("express");
const cors = require("cors");

const roomsRouter = require("./routes/rooms");
const guestsRouter = require("./routes/guests");
const bookingsRouter = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request log — helpful while developing against the frontend.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "hotel-management-backend", time: new Date().toISOString() });
});

app.use("/api/rooms", roomsRouter);
app.use("/api/guests", guestsRouter);
app.use("/api/bookings", bookingsRouter);

// 404 fallback for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Hotel Management API running on http://localhost:${PORT}`);
});