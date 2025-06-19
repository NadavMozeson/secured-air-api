# 🛩️ Secured Air API

A comprehensive RESTful API for accessing airline, airport, and flight route data with tiered access control and JWT-based authentication.

---

## 📋 Table of Contents

1. [🚀 Quick Start](#-quick-start)
2. [🔑 Authentication & Tiers](#-authentication--tiers)
3. [📡 API Endpoints](#-api-endpoints)
4. [💡 Usage Examples](#-usage-examples)
5. [🔧 Development](#-development)

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation & Setup

```bash
# 1. Clone repository
git clone https://github.com/NadavMozeson/secured-air-api.git
cd secured-air-api

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES=30m
PORT=3000
PRODUCTION=development
EOF

# 4. Start server
npm run dev  # Development
# OR
npm start    # Production
```

🌐 **API will be available at:** `http://localhost:3000`

### Available Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Development server with hot reload |
| `npm start`     | Production server                  |
| `npm run build` | Build for production               |
| `npm run lint`  | Run ESLint                         |

---

## 🔑 Authentication & Tiers

### Getting Authentication Token

```http
GET /token/{tier}
```

**Parameters:** `tier` = `free` | `pro` | `elite`

The token is automatically set as an HTTP-only cookie named `auth_token`.

### Access Tier Comparison

| Tier         | Countries Access    | Authentication  | Features                     |
| ------------ | ------------------- | --------------- | ---------------------------- |
| **🆓 FREE**  | Israel only         | ❌ Not required | Basic access to Israeli data |
| **⭐ PRO**   | 11 major countries¹ | ✅ Required     | Extended country access      |
| **💎 ELITE** | Worldwide access    | ✅ Required     | Complete global access       |

¹ _PRO countries: Israel, United States, Canada, United Kingdom, Germany, France, Australia, Japan, Brazil, China, India_

---

## 📡 API Endpoints

### 🏠 Base Endpoints

| Endpoint        | Method | Description         | Auth Required |
| --------------- | ------ | ------------------- | ------------- |
| `/`             | GET    | Welcome message     | ❌            |
| `/health`       | GET    | API health status   | ❌            |
| `/token/{tier}` | GET    | Generate auth token | ❌            |

### ✈️ Airlines Endpoints

| Endpoint                          | Description                 | Example                    |
| --------------------------------- | --------------------------- | -------------------------- |
| `GET /airlines`                   | Get all accessible airlines | `/airlines`                |
| `GET /airlines/countries`         | List accessible countries   | `/airlines/countries`      |
| `GET /airlines/country/{country}` | Get airlines by country     | `/airlines/country/Israel` |
| `GET /airlines/statistics`        | Get airline statistics      | `/airlines/statistics`     |
| `GET /airlines/access/{country}`  | Check country access        | `/airlines/access/Canada`  |

### 🏢 Airports Endpoints

| Endpoint                          | Description                 | Example                    |
| --------------------------------- | --------------------------- | -------------------------- |
| `GET /airports`                   | Get all accessible airports | `/airports`                |
| `GET /airports/countries`         | List accessible countries   | `/airports/countries`      |
| `GET /airports/country/{country}` | Get airports by country     | `/airports/country/Israel` |
| `GET /airports/statistics`        | Get airport statistics      | `/airports/statistics`     |
| `GET /airports/access/{country}`  | Check country access        | `/airports/access/Germany` |

### 🛫 Flight Routes Endpoints

| Endpoint                              | Description               | Example                      |
| ------------------------------------- | ------------------------- | ---------------------------- |
| `GET /routes`                         | Get all accessible routes | `/routes`                    |
| `GET /routes/countries`               | List accessible countries | `/routes/countries`          |
| `GET /routes/country/{country}`       | Get routes by country     | `/routes/country/Israel`     |
| `GET /routes/from/{source}/to/{dest}` | Routes between countries  | `/routes/from/Israel/to/USA` |
| `GET /routes/statistics`              | Get route statistics      | `/routes/statistics`         |

---

## 💡 Usage Examples

### 🖥️ cURL Examples

```bash
# Get health status (no auth required)
curl http://localhost:3000/health

# Get PRO token
curl -c cookies.txt http://localhost:3000/token/pro

# Access PRO features with token
curl -b cookies.txt http://localhost:3000/airlines/country/Canada

# Get accessible countries for current tier
curl -b cookies.txt http://localhost:3000/airlines/countries

# Check if you can access a specific country
curl -b cookies.txt http://localhost:3000/routes/access/Germany
```

### 🔥 JavaScript/Fetch Examples

```javascript
// 1. Get authentication token
const getToken = async (tier) => {
  const response = await fetch(`/token/${tier}`, {
    credentials: 'include', // Important for cookies
  });
  return response.json();
};

// 2. Get airlines data
const getAirlines = async () => {
  const response = await fetch('/airlines', {
    credentials: 'include',
  });
  return response.json();
};

// 3. Get data for specific country
const getAirlinesByCountry = async (country) => {
  const response = await fetch(
    `/airlines/country/${encodeURIComponent(country)}`,
    {
      credentials: 'include',
    }
  );
  return response.json();
};

// 4. Usage workflow
async function main() {
  // Get PRO access
  await getToken('pro');

  // Fetch data
  const airlines = await getAirlines();
  const israelAirlines = await getAirlinesByCountry('Israel');
  const canadianAirlines = await getAirlinesByCountry('Canada');

  console.log('Airlines:', airlines);
  console.log('Israeli Airlines:', israelAirlines);
  console.log('Canadian Airlines:', canadianAirlines);
}
```

### 📊 Response Examples

**Successful Response:**

```json
{
  "success": true,
  "tier": "pro",
  "country": "Canada",
  "airlines": [...],
  "count": 25
}
```

**Access Denied Response:**

```json
{
  "success": false,
  "error": "Access to 'Germany' requires a higher subscription tier",
  "currentTier": "free",
  "requiredTier": "pro"
}
```

---

## 🔧 Development

### 📁 Project Structure

```
src/
├── app.ts                    # Main application entry
├── data/                     # CSV data files
│   ├── airlines.csv
│   ├── airports.csv
│   └── routes.csv
├── middleware/               # Express middleware
│   ├── featureAccess.ts      # Access control
│   └── validationMiddleware.ts
├── routes/                   # API route handlers
│   ├── airlines.ts
│   ├── airports.ts
│   ├── flightRoutes.ts
│   └── index.ts
├── services/                 # Business logic
│   ├── airlinesService.ts
│   ├── airportsService.ts
│   └── routesService.ts
└── utils/
    └── jwtManager.ts         # JWT utilities
```

### 🛠️ Technology Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **Zod** - Schema validation
- **Cookie Parser** - Cookie handling

### 🚨 Error Handling

The API returns consistent error responses with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient tier access)
- `500` - Internal Server Error

---

**🎯 Ready to get started?** Try the health endpoint: `curl http://localhost:3000/health`
