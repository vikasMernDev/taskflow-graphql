# MERN GraphQL Task Manager

A simple task manager built with React, Apollo GraphQL, Express, and MongoDB.

## Project structure

- `client/` - React + Vite frontend
- `server/` - Express + Apollo Server backend

## Requirements

- Node.js 20.19+
- MongoDB running locally at `mongodb://localhost:27017/taskmanager`

## Setup

### Server

```bash
cd server
npm install
npm test
copy .env.example .env
npm start
```

Replace `JWT_SECRET` in `.env` with a long, random value before starting the server. `CLIENT_ORIGIN` accepts a comma-separated allowlist when more than one frontend origin is needed.

The GraphQL endpoint will run at `http://localhost:4000/graphql`.

### Client

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Open the URL shown by Vite, usually `http://localhost:5173`.

## Notes

- Authentication uses HTTP-only cookies.
- Server and client URLs can be configured with `PORT`, `CLIENT_ORIGIN`, and `VITE_GRAPHQL_URL`.
- `register`, `login`, `logout`, `addTask`, `updateTask`, and `deleteTask` are available GraphQL operations.
- If port `4000` is already in use, stop the existing Node process or update the server port in `server/index.js`.
