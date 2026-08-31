/**
 * dataStore.js
 * -----------------------------------------------------------------------
 * Tiny file-based data layer. Each "table" (rooms, guests, bookings) is a
 * plain JSON array stored in /backend/data/<name>.json.
 *
 * There is no external database to install or configure — every read and
 * write goes straight through Node's fs module to a local file, which
 * keeps the project runnable anywhere with zero setup. Swap this module
 * out for a real DB layer (Mongo/Postgres/etc.) later without touching
 * the routes, since every route only calls the methods below.
 * -----------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

function filePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

/** Ensure the data directory + file exist before reading/writing. */
function ensureFile(collection) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, "[]", "utf-8");
  return fp;
}

function readAll(collection) {
  const fp = ensureFile(collection);
  const raw = fs.readFileSync(fp, "utf-8");
  try {
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error(`Failed to parse ${collection}.json, resetting to []`, err);
    return [];
  }
}

function writeAll(collection, records) {
  const fp = ensureFile(collection);
  fs.writeFileSync(fp, JSON.stringify(records, null, 2), "utf-8");
}

function getById(collection, id) {
  return readAll(collection).find((r) => String(r.id) === String(id));
}

function nextId(collection) {
  const records = readAll(collection);
  return records.length ? Math.max(...records.map((r) => Number(r.id))) + 1 : 1;
}

function insert(collection, record) {
  const records = readAll(collection);
  const withId = { id: nextId(collection), ...record };
  records.push(withId);
  writeAll(collection, records);
  return withId;
}

function update(collection, id, patch) {
  const records = readAll(collection);
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  records[idx] = { ...records[idx], ...patch, id: records[idx].id };
  writeAll(collection, records);
  return records[idx];
}

function remove(collection, id) {
  const records = readAll(collection);
  const idx = records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return false;
  records.splice(idx, 1);
  writeAll(collection, records);
  return true;
}

module.exports = { readAll, writeAll, getById, insert, update, remove, nextId };