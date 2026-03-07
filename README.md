# WEB Final Project – Afeka Trips 2026

## Authors
- Nikol Pinchevsky

---

# Project Overview

Afeka Trips 2026 is a full-stack web application developed as a final project for the Web Development course.

The system allows users to generate travel routes based on location, trip type, and trip duration, and then view them on an interactive map with weather information.

The application supports user authentication and allows saving trips to a database and viewing them later.

The system is built using two servers as required in the project instructions:

- **Express Server** – Handles authentication, database operations, and API endpoints.
- **Next.js Server** – Handles the frontend interface and protected pages.

---

# Main Features

## Authentication
- User registration and login
- Password hashing using **bcrypt**
- JWT based authentication
- Access token and refresh token stored in cookies
- Middleware protection for private pages
- Silent token refresh

---

## Planner Page

The user can generate a new trip by selecting:

- Country / city / location
- Trip type (bike or trek)
- Number of days

The system then generates a trip and displays:

- Route summary
- Interactive map with the generated route
- Weather forecast for the next days
- Destination image

---

## Real Route Generation

Routes are generated using routing services based on real roads and trails, rather than simple straight lines between points.

---

## Save Trip

After reviewing the generated route, the user can approve and save the trip.

Saved trips are stored in **MongoDB**.

---

## History Page

Users can view their previously saved trips.

Each trip can be opened to see full details including an updated weather forecast.

---

# Technologies Used

## Frontend

- Next.js
- React
- TypeScript
- Leaflet (map rendering)
- Next.js Middleware

---

## Backend

- Node.js
- Express.js
- MongoDB
- JWT
- bcrypt
- cookie-parser
- cors

---

## External APIs / Services

- **Nominatim / OpenStreetMap** – location geocoding
- **OSRM** – route generation
- **Open-Meteo** – weather forecast
- **Image service** – destination image

---

## Project Structure

```text
afeka-trips-2026
│
├── server-express
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── web-next
    ├── app
    ├── components
    ├── lib
    ├── middleware.ts
    ├── package.json
    └── .env.local



---

# How to Run the Project Locally

## 1. Clone the repository
    git clone https://github.com/nikolpinchevsky/WEB-final-project.git

## 2. Install backend dependencies
    cd server-express
    npm install



---

## 3. Create backend environment file

Create `.env` inside `server-express`

Example:
PORT=4000
CLIENT_ORIGIN=http://localhost:3000

MONGO_URI=your_mongo_connection_string
DB_NAME=your_database_name
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TTL=15m
REFRESH_TTL=1d
NODE_ENV=development



---

## 4. Run backend server
npm run dev
or
npm start



---

## 5. Install frontend dependencies
cd ../web-next
npm install



---

## 6. Create frontend environment file

Create `.env.local` inside `web-next`

Example:
NEXT_PUBLIC_API_BASE=http://localhost:4000



---

## 7. Run frontend
npm run dev

The application will run at:
http://localhost:3000




---

# Live Demo

Frontend:
(add frontend deployment link here)

Backend API:
(add backend deployment link here)




---

# Screenshots

Planner Page

![Planner](screenshots/planner.png)

Map View

![Map](screenshots/map.png)

History Page

![History](screenshots/history.png)

---

# Known Issues

- Route generation depends on external routing services.
- Weather forecast accuracy depends on external APIs.
- Some locations may not have detailed routing data.

---

# Future Improvements

Possible improvements for the system:

- Support for more trip types
- Better route optimization
- Improved mobile interface
- Integration with additional weather services
