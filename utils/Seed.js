/**
 * utils/seed.js — populate data/*.json with a handful of demo records
 * so the frontend has something to show immediately.
 *
 * Run with: npm run seed   (or: node utils/seed.js)
 * Safe to re-run — it overwrites the three JSON files from scratch.
 */
const store = require("../models/dataStore");

const rooms = [
  { id: 1, number: "101", type: "Single", rate: 60, floor: 1, capacity: 1, amenities: ["Wi-Fi"], status: "available" },
  { id: 2, number: "102", type: "Double", rate: 90, floor: 1, capacity: 2, amenities: ["Wi-Fi", "TV"], status: "available" },
  { id: 3, number: "201", type: "Deluxe", rate: 140, floor: 2, capacity: 2, amenities: ["Wi-Fi", "TV", "Minibar"], status: "available" },
  { id: 4, number: "202", type: "Deluxe", rate: 140, floor: 2, capacity: 2, amenities: ["Wi-Fi", "TV", "Minibar"], status: "maintenance" },
  { id: 5, number: "301", type: "Suite", rate: 260, floor: 3, capacity: 4, amenities: ["Wi-Fi", "TV", "Minibar", "Balcony"], status: "available" },
];

const guests = [
  { id: 1, name: "Ayesha Rahman", email: "ayesha@example.com", phone: "+880 1711-000111", idType: "Passport", idNumber: "P1234567", address: "Dhaka, BD", createdAt: new Date().toISOString() },
  { id: 2, name: "James Carter", email: "jcarter@example.com", phone: "+1 555-234-1122", idType: "Driver's License", idNumber: "DL998877", address: "Austin, TX", createdAt: new Date().toISOString() },
];

const today = new Date();
const addDays = (d, n) => new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10);

const bookings = [
  {
    id: 1,
    roomId: 3,
    guestId: 1,
    checkInDate: addDays(today, -1),
    checkOutDate: addDays(today, 2),
    status: "checked-in",
    notes: "Late arrival, ~10pm",
    actualCheckIn: new Date(Date.now() - 86400000).toISOString(),
    actualCheckOut: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    roomId: 2,
    guestId: 2,
    checkInDate: addDays(today, 1),
    checkOutDate: addDays(today, 4),
    status: "booked",
    notes: "",
    actualCheckIn: null,
    actualCheckOut: null,
    createdAt: new Date().toISOString(),
  },
];

store.writeAll("rooms", rooms);
store.writeAll("guests", guests);
store.writeAll("bookings", bookings);

// Room 3 is occupied by booking #1 above — reflect that on the room too.
store.update("rooms", 3, { status: "occupied" });

console.log("Seeded rooms, guests and bookings into backend/data/*.json");