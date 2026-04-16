[v0.2.0] – Full Stack Integration
Added
MySQL integration with connection pool (config/db.js) and initial schema (data.sql)
User authentication system with JWT and password hashing via bcrypt
Auth routes and middleware for protected endpoints
Transactions API with full CRUD operations scoped per user
Server bootstrap with Express (server.js)
Frontend application with authentication flow and API integration
Persistence of calculation history to backend
Project configuration (package.json, dependencies)
Features
User registration and login
Secure authentication using tokens
Isolated user data (each user sees only their transactions)
Backend ↔ frontend communication via API
Financial data storage in database
Tech Stack
Node.js + Express
MySQL
JWT + bcrypt
Vanilla JS (frontend)
