# WebSocket Chat Application

A real-time chat application built with WebSockets, React, and Node.js.

## Features
* Real-time messaging
* Multi-room chat
* User presence
* Auto-reconnection
* Modern UI with Tailwind CSS

## Tech Stack
* **Backend**: Node.js, TypeScript, WebSocket
* **Frontend**: React, TypeScript, Vite, Tailwind CSS

## Setup

### Prerequisites
Make sure you have Node.js installed on your system.

### 1. Clone Repository
```bash
git clone https://github.com/Om-Thote/websocket-chatapp.git
cd websocket-chatapp
```

### 2. Backend Setup
```bash
cd chat-app-backend
npm install
npm run dev
```
You should see: `WebSocket server running on port 8080`

### 3. Frontend Setup
Open a new terminal window/tab:
```bash
cd chat-app-frontend
npm install
npm run dev
```

### 4. Open Browser
Go to `http://localhost:5173` and start chatting!

## How to Use
1. Enter your username
2. Join a room (default: "123" or create your own room ID)
3. Start messaging in real-time!
4. Open multiple browser tabs to test multi-user functionality

## Project Structure
```
websocket-chatapp/
├── README.md
├── chat-app-backend/     # Backend server code
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── chat-app-frontend/    # Frontend React app
    ├── src/
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## Screenshots
![Chat Application Interface](<img width="1280" height="680" alt="Screenshot 2025-08-04 at 12 23 51 AM" src="https://github.com/user-attachments/assets/16faff95-a84f-408b-887c-38ae39786690" />
)

## What I Learned
* WebSocket connections and real-time communication
* React state management with TypeScript
* Building responsive UIs with Tailwind CSS
* Handling connection errors and reconnection logic
* Managing multiple chat rooms and user presence
* Implementing auto-reconnection with exponential backoff

## Future Enhancements
- [+] Message persistence with database
- [+] User authentication
- [+] Private messaging
- [+] File/image sharing
- [+] Message reactions and emojis

---
Built while learning WebSocket technology 🚀
