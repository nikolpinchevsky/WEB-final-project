# WEB Final Project – Afeka Trips 2026

## Authors
- Nikol Pinchevsky
- [Partner Name]

## Project Overview
Afeka Trips 2026 is a full-stack web application developed as a final project for the Web course.

The system allows users to:
- Register and log in securely
- Generate travel routes based on location, trip type, and trip duration
- View the generated route on an interactive map
- Receive a real weather forecast for the next 3 days
- Save approved trips to the database
- View saved trip history with updated weather forecast

The project is built using two servers, as required:
- **Express server** – authentication, JWT, cookies, database, trip APIs
- **Next.js server** – frontend, middleware protection, pages, map display

---

## Main Features

### Authentication
- User registration and login
- Password hashing with `bcrypt`
- JWT-based authentication
- Access token + refresh token stored in cookies
- Silent token refresh using middleware

### Planner Page
The user selects:
- Country / city / location
- Trip type: bike or trek
- Number of days

The system generates a trip and displays:
- Route summary
- Map with route
- Weather forecast
- Destination image

### Real Route Generation
Routes are generated as realistic routes on roads / trails using routing services, and not as straight lines between points.

### Save Trip
After the user reviews and approves the generated result, the trip can be saved to MongoDB.

### History Page
Users can view previously saved trips and open full trip details, including updated weather forecast.

---

## Technologies Used

### Frontend
- Next.js
- React
- TypeScript
- Leaflet
- Next.js Middleware

### Backend
- Node.js
- Express.js
- MongoDB
- JWT
- bcrypt
- cookie-parser
- cors

### External APIs / Services
- Nominatim / OpenStreetMap – geocoding
- OSRM – route generation
- Open-Meteo – weather forecast
- Image service – destination image

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