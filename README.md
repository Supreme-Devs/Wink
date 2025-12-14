# WINK

Group posts, real-time chat and WebRTC video calls built with Node.js, React, MongoDB, WebSockets and WebRTC.

## Overview

This project is a social app where users can create posts, join group chats, and start group video calls. The backend is built with Node.js and MongoDB; the frontend uses React. Real-time chat and signaling for WebRTC are handled via WebSockets (Socket.IO recommended). WebRTC handles peer-to-peer audio/video streams; an SFU is recommended for larger groups.

## Features

- Posts: create, edit, delete, and view posts inside groups
- Real-time group chat: powered by WebSockets
- Group video/audio calls: WebRTC with socket-based signaling
- Authentication: JWT-based auth and protected API routes

## Tech Stack

- Backend: Node.js + Express
- Frontend: React
- Realtime: Socket.IO / WebSockets
- Media: WebRTC (STUN/TURN)
- Database: MongoDB (Mongoose models)

## Repository Layout

- `backend/` — Node/Express server, API routes, auth, socket signaling
- `frontend/` — React app, UI, WebRTC client and socket client

Important files:

- `backend/server.js` — server entry (socket + REST setup)
- `backend/routes/` — API endpoints (auth, posts, groups, messages)
- `frontend/src/services/socket.js` — socket client helper

## Prerequisites

- Node.js 16+ and npm or yarn
- MongoDB (local or Atlas)
- Optional: TURN server for production (coturn)

## Environment Variables

Backend (`backend/.env`):

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `PORT` — backend port (default `5000`)
- `CLIENT_ORIGIN` — allowed frontend origin (e.g. `http://localhost:3000`)
- `STUN_SERVERS` — optional comma-separated STUN/TURN servers

Frontend (`frontend/.env`):

- `REACT_APP_API_URL` — backend API base URL (e.g. `http://localhost:5000`)
- `REACT_APP_SOCKET_URL` — socket server URL (e.g. `http://localhost:5000`)

### Example `.env.example` (backend)

```
MONGO_URI=mongodb://localhost:27017/video-app
JWT_SECRET=replace_with_strong_secret
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
STUN_SERVERS=stun:stun.l.google.com:19302
```

### Example `.env.example` (frontend)

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Quick Start — Local Development

Backend

```bash
cd backend
npm install
# create .env from .env.example
npm run dev # or `node server.js` depending on project
```

Frontend

```bash
cd frontend
npm install
npm start
```

Open the frontend at `http://localhost:3000`.

## WebRTC Signaling (brief)

Signaling uses sockets to exchange session descriptions (SDP) and ICE candidates. Example socket events:

- `join-room` — client joins a room (group call)
- `offer` — SDP offer from caller
- `answer` — SDP answer from callee
- `ice-candidate` — ICE candidate forwarding
- `user-left` — notify peers to remove a participant

Example client pseudocode (socket event handlers):

```js
// join
socket.emit("join-room", { roomId, userId });

// send offer
socket.emit("offer", { to: targetId, sdp: localDescription });

// receive offer
socket.on("offer", async ({ from, sdp }) => {
  await pc.setRemoteDescription(sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("answer", { to: from, sdp: pc.localDescription });
});

// ice
pc.onicecandidate = (e) => {
  if (e.candidate)
    socket.emit("ice-candidate", { to: targetId, candidate: e.candidate });
};
socket.on("ice-candidate", ({ candidate }) => pc.addIceCandidate(candidate));
```

For group calls: either create an SFU backend (recommended for >4 participants) or form mesh connections (P2P) for small groups.

## Data Models (suggested)

- `User` — { \_id, name, email, passwordHash, avatar }
- `Post` — { \_id, authorId, groupId, content, media, createdAt }
- `Group` — { \_id, name, memberIds, createdAt }
- `Message` — { \_id, groupId, authorId, text, createdAt }
- `CallSession` (optional) — { \_id, groupId, participants, startedAt, endedAt }

## API (example endpoints)

- `POST /api/auth/register` — register
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/posts` — fetch posts (auth)
- `POST /api/posts` — create post (auth)
- `GET /api/groups/:id/messages` — fetch chat messages

Protect routes with JWT middleware on the backend and send the JWT in `Authorization: Bearer <token>`.

## Testing

- Frontend: `cd frontend && npm test`
- Backend: `cd backend && npm test` (if tests are configured)

## Deployment Notes

- Build frontend: `cd frontend && npm run build` and serve it using nginx, Vercel, or Netlify.
- Run backend on a cloud VM/container; use PM2 or Docker in production.
- Use HTTPS and WSS for signaling; configure TURN servers (coturn) to improve media connectivity.

## Troubleshooting

- No camera/mic: ensure `getUserMedia` permissions and HTTPS.
- Blank video: check that tracks are added to peer connection and remote <video> elements are attached.
- Socket disconnects: verify CORS, origin, and that the socket URL is correct.

## Contributing

- Fork the repo, create a feature branch, add tests, and open a PR with a clear description.

---

If you'd like, I can now:

- add `backend/.env.example` and `frontend/.env.example` files,
- scaffold a minimal `backend/routes/signaling.js` and `frontend/src/services/socket.js` example,
- or update the README further with sequence diagrams or API docs.

File saved: README.md
