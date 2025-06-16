# Tunisian Chat Application

A chat application with a Tunisian theme, supporting both video and text chat.

## Features

- Text chat with random partners
- Video chat with WebRTC
- Real-time messaging
- User matching based on interests
- Tunisian-themed UI design
- Mobile responsive design

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL
- Redis

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd tn4
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../video-chat-app
npm install
```

4. Set up environment variables
```bash
# In backend directory
cp .env.example .env
# Edit .env with your database and Redis credentials
```

5. Start Docker containers for PostgreSQL and Redis
```bash
cd ../backend
docker-compose up -d
```

6. Run database migrations
```bash
npx prisma migrate dev
```

## Running the Application

### Start the backend server
```bash
cd backend
npm run dev
```

### Start the frontend development server
```bash
cd ../video-chat-app
npm run dev
```

The application should now be running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Docker Support

The application includes Docker support for PostgreSQL and Redis services. To start these services:

```bash
cd backend
docker compose up -d
```

This will start PostgreSQL on port 5434 and Redis on port 6380.

## Accessing on Local Network

The application is configured to be accessible from other devices on your local network:

1. Find your computer's local IP address (displayed when starting the backend server, or use `hostname -I`)
2. On other devices (phones, tablets, other computers), use the following URLs:
   - Frontend: http://YOUR_LOCAL_IP:3000
   - Backend: http://YOUR_LOCAL_IP:4000

### Testing on Multiple Devices

1. Open the application on two different devices (or two browser windows)
2. Navigate to the chat URL on both devices
3. Start a new chat on each device
4. The devices should connect to each other and allow chatting

## Testing the Chat Application

### Text Chat
1. Open two browser windows (or tabs) to http://localhost:3000/text-chat
2. In each window, click the "New Chat" button
3. The two chat instances should connect to each other
4. Type messages in either window and see them appear in the other window

### Video Chat
1. Open two browser windows (or tabs) to http://localhost:3000/video-chat
2. In each window, click the "Find a Partner" button
3. Allow camera and microphone access when prompted
4. The two video chat instances should connect to each other
5. You should be able to see and hear the other person in each window

### Troubleshooting

- If authentication fails, use the "Retry Connection" button
- If camera/microphone access is denied, check browser permissions
- Ensure both the backend server and frontend development server are running
- Check browser console for any error messages
- Verify that PostgreSQL and Redis containers are running

## License

MIT 