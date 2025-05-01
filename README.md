# EcoHabit Backend

This is the backend API for the EcoHabit application, providing authentication and user management functionality.

## Features

- User authentication (login/register)
- JWT-based authentication
- Role-based access control (User, NGO, Admin)
- User management for administrators

## Requirements

- Node.js (v16+)
- MongoDB (local or remote)

## Setup Instructions

1. Install dependencies:
```
npm install
```

2. Set up environment variables:
Copy the `.env.example` file to `.env` and update the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecohabit
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

3. Create an admin user (optional):
```
npm run create-admin
```
This will create an admin user with the following credentials:
- Email: admin@ecohabit.com
- Password: admin123

## Running the Server

Start the development server:
```
npm run dev
```

Start the production server:
```
npm start
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user
- `GET /auth/user` - Get the current user (protected)
- `GET /auth/logout` - Logout a user (protected)

### User Management (Admin only)

- `GET /users` - Get all users
- `GET /users/:id` - Get a specific user
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `PUT /users/:id/deactivate` - Deactivate a user
- `PUT /users/:id/activate` - Activate a user 