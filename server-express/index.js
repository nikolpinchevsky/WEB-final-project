require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const fetch = global.fetch; 

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://web-final-frontend-nx9p.onrender.com"
  ],
  credentials: true
}));

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

let db;

// ---------- DB ----------
async function connectDb() {
  const client = new MongoClient(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  db = client.db(process.env.DB_NAME);

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("trips").createIndex({ userId: 1, createdAt: -1 });

  console.log("Mongo connected");
}

// ---------- JWT helpers ----------
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TTL || "15m",
  });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TTL || "1d",
  });
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const isProd = process.env.NODE_ENV === "production";
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
  res.cookie(ACCESS_COOKIE, accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...common, maxAge: 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

// ---------- auth middleware ----------
function requireAuth(req, res, next) {
  try {
    const token = req.cookies[ACCESS_COOKIE];
    if (!token) return res.status(401).json({ message: "Missing access token" });

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { email, name }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

// ---------- helpers ----------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function osrmProfile(tripType) {
  return tripType === "bike" ? "cycling" : "walking";
}

function getImageUrlForPlace(placeName) {
  // Generate a consistent hash from the place name
  const hash = placeName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to generate a seed for picsum.photos
  const seed = Math.abs(hash);
  
  // Picsum provides different images based on ID
  const image = `https://picsum.photos/seed/${seed}/800/600`;  
  return image;
}

// Geocode: place name -> lat/lng
async function geocodePlace(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, {
    headers: { "User-Agent": "afeka-trips-2026/1.0 (student project)" },
  });
  const data = await r.json();
  if (!data?.[0]) throw new Error("Geocode failed for: " + q);
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

// OSRM: curved route along roads/trails
async function routeWithOSRM(points, tripType) {
  if (!Array.isArray(points) || points.length < 2) {
    return { geometry: points || [], distanceKm: 0, durationMin: 0 };
  }

  const profile = osrmProfile(tripType);
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;

  const r = await fetch(url);
  const data = await r.json();

  if (!r.ok || !data?.routes?.[0]?.geometry?.coordinates) {
    throw new Error(`OSRM failed: ${JSON.stringify(data).slice(0, 250)}`);
  }

  const route = data.routes[0];
  const geometry = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

  return {
    geometry,
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMin: Math.round(route.duration / 60),
  };
}

/**
 * Forecast (Open-Meteo) ל-3 ימים החל ממחר.
 */
async function getForecast3DaysFromTomorrow({ lat, lng }) {
  const tz = "Asia/Jerusalem";
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lng)}` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max` +
    `&forecast_days=4` + // היום + 3 ימים קדימה
    `&timezone=${encodeURIComponent(tz)}`;

  const r = await fetch(url);
  const data = await r.json();

  if (!r.ok || !data?.daily?.time) {
    throw new Error(`Forecast failed: ${JSON.stringify(data).slice(0, 250)}`);
  }

  const time = data.daily.time;
  const tmax = data.daily.temperature_2m_max || [];
  const tmin = data.daily.temperature_2m_min || [];
  const wcode = data.daily.weathercode || [];
  const wind = data.daily.windspeed_10m_max || [];

  const out = [];
  for (let i = 1; i <= 3 && i < time.length; i++) {
    out.push({
      date: time[i],
      tempMax: tmax[i],
      tempMin: tmin[i],
      weatherCode: wcode[i],
      windMax: wind[i],
    });
  }
  return out;
}

// Build trip structure (mock meta, real geometry from OSRM)
function buildTrip({ location, tripType, days }) {
  const safeLocation = String(location || "Israel").trim() || "Israel";
  const safeTripType = tripType === "trek" ? "trek" : "bike";
  const safeDays = clamp(
    Number(days) || (safeTripType === "bike" ? 2 : 1),
    safeTripType === "bike" ? 2 : 1,
    3
  );

  if (safeTripType === "bike") {
    const towns = [
      `${safeLocation} Center`,
      `${safeLocation} Old Town`,
      `${safeLocation} Coast`,
      `${safeLocation} Hills`,
      `${safeLocation} Valley`,
    ];

    const route = [];
    for (let d = 1; d <= safeDays; d++) {
      const from = towns[(d - 1) % towns.length];
      const to = towns[d % towns.length];
      const distanceKm = 35 + d * 10; 
      route.push({ day: d, from, to, distanceKm });
    }

    return {
      name: safeLocation,
      tripType: "bike",
      days: safeDays,
      summary: `מסלול אופניים של ${safeDays} ימים באזור ${safeLocation}.`,
      route,
    };
  }

  const loops = [];
  for (let i = 1; i <= safeDays; i++) {
    loops.push({
      loop: i,
      distanceKm: 6 + i * 2,
      description: `לופ מס׳ ${i} סביב ${safeLocation} – הליכה רגועה.`,
    });
  }

  return {
    name: safeLocation,
    tripType: "trek",
    days: safeDays,
    summary: `טרק של ${safeDays} ימים באזור ${safeLocation}.`,
    loops,
  };
}

// ---------- auth routes ----------
app.post("/auth/signup", async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) return res.status(400).json({ message: "Missing fields" });

    const users = db.collection("users");
    const passwordHash = await bcrypt.hash(password, 10);

    const doc = { email, name, passwordHash, createdAt: Date.now() };
    await users.insertOne(doc);

    return res.json({ ok: true });
  } catch (e) {
    if (String(e).includes("E11000")) return res.status(409).json({ message: "Email already exists" });
    return res.status(500).json({ message: "Server error", details: String(e) });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const users = db.collection("users");
    const user = await users.findOne({ email });
    if (!user) return res.status(401).json({ message: "Bad credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Bad credentials" });

    const payload = { email: user.email, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setAuthCookies(res, { accessToken, refreshToken });

    return res.json({
      ok: true,
      user: payload,
      accessToken,
      refreshToken
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", details: String(e) });
  }
});

app.post("/auth/refresh", async (req, res) => {
  try {
    const rt = req.cookies[REFRESH_COOKIE];
    if (!rt) return res.status(401).json({ message: "Missing refresh token" });

    const decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
    const payload = { email: decoded.email, name: decoded.name };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    setAuthCookies(res, { accessToken, refreshToken });
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

app.post("/auth/logout", (req, res) => {
  clearAuthCookies(res);
  res.json({ ok: true });
});

app.get("/auth/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// ---------- generate (NO DB SAVE) ----------
app.post("/trips/generate", async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: "DB not connected" });

    const body = req.body || {};
    const baseTrip = buildTrip({
      location: body.location,
      tripType: body.tripType,
      days: body.days,
    });

    const center = await geocodePlace(baseTrip.name);

    const waypoints =
      baseTrip.tripType === "bike"
        ? [
            center,
            { lat: center.lat + 0.02, lng: center.lng + 0.02 },
            { lat: center.lat + 0.04, lng: center.lng + 0.01 },
          ]
        : [
            center,
            { lat: center.lat + 0.01, lng: center.lng + 0.01 },
            { lat: center.lat + 0.015, lng: center.lng - 0.005 },
            center,
          ];

    let routed;
    try {
      routed = await routeWithOSRM(waypoints, baseTrip.tripType);
    } catch (e) {
      console.warn("OSRM failed, fallback:", e);
      routed = { geometry: waypoints, distanceKm: null, durationMin: null };
    }

    let forecast = [];
    try {
      forecast = await getForecast3DaysFromTomorrow(center);
    } catch (e) {
      console.warn("Forecast failed:", e);
      forecast = [];
    }

    const imageUrl = getImageUrlForPlace(baseTrip.name);

    const tripForResponse = {
      ...baseTrip,
      center,
      geometry: routed.geometry,
      distanceKm: routed.distanceKm,
      durationMin: routed.durationMin,
      forecast,
      imageUrl,
    };

    return res.json({ ok: true, ...tripForResponse });
  } catch (e) {
    console.error("Generate error:", e);
    return res.status(500).json({ message: "Failed to generate trip", details: String(e) });
  }
});

// ---------- save approved trip (REQUIRES LOGIN, NO FORECAST SAVED) ----------
app.post("/trips/save", requireAuth, async (req, res) => {
  try {
    const trips = db.collection("trips");
    const body = req.body || {};

    const toSave = { ...body };
    delete toSave.forecast; 

    const doc = {
      userId: req.user.email,
      ...toSave,
      createdAt: Date.now(),
    };

    const result = await trips.insertOne(doc);
    return res.json({ ok: true, id: String(result.insertedId) });
  } catch (e) {
    return res.status(500).json({ message: "Failed to save trip", details: String(e) });
  }
});

// ---------- history list (adds forecast dynamically) ----------
app.get("/trips", requireAuth, async (req, res) => {
  try {
    const trips = db.collection("trips");
    const list = await trips
      .find({ userId: req.user.email })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const enriched = [];
    for (const t of list) {
      const trip = { ...t, _id: String(t._id) };
      try {
        const center = trip.center || (trip.geometry?.[0] ? trip.geometry[0] : null);
        if (center?.lat && center?.lng) {
          trip.forecast = await getForecast3DaysFromTomorrow(center);
        } else {
          trip.forecast = [];
        }
      } catch {
        trip.forecast = [];
      }
      enriched.push(trip);
    }

    res.json({ ok: true, trips: enriched });
  } catch (e) {
    res.status(500).json({ message: "Failed to list trips", details: String(e) });
  }
});

// ---------- history detail (fix 500!) ----------
app.get("/trips/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const trips = db.collection("trips");
    const tripDb = await trips.findOne({ _id: new ObjectId(id), userId: req.user.email });
    if (!tripDb) return res.status(404).json({ message: "Not found" });

    const trip = { ...tripDb, _id: String(tripDb._id) };

    try {
      const center = trip.center || (trip.geometry?.[0] ? trip.geometry[0] : null);
      if (center?.lat && center?.lng) {
        trip.forecast = await getForecast3DaysFromTomorrow(center);
      } else {
        trip.forecast = [];
      }
    } catch {
      trip.forecast = [];
    }

    res.json({ ok: true, trip });
  } catch (e) {
    res.status(500).json({ message: "Failed to get trip", details: String(e) });
  }
});

// ---------- start ----------
connectDb().then(() => {
  app.listen(process.env.PORT || 4000, () => console.log("Express running"));
});