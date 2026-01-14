import cors from 'cors';
import express from 'express';
import { CLIENT_TO_SERVER_EVENTS_NAMES, ENDPOINTS } from './config';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { handleAppForClient, handleAppCleanup } from './app';
import { getAllStrokes, startAutomaticCleanup, cleanupOldStrokes } from './draw';

dotenv.config({ path: '../.env' })

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const getServerPort = () => {
  return process.env.SERVER_PORT || 3007;
}

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on(CLIENT_TO_SERVER_EVENTS_NAMES.CONNECTION, (socket) => {
  handleAppForClient(app, io, socket);
})

app.get('/', (req, res) => {
  res.status(200).send("0K");
});

/* Base Endpoint, you can use this to make sure the server is working on the right port */
app.get(ENDPOINTS.API, (req, res) => {
  const acceptType = req.headers["accept"] || "";
  res.status(200).sendFile(__dirname+'/views/index.html');
});

const SERVER_PORT = getServerPort();
server.listen(SERVER_PORT, () => {
  console.log(`Server (HTTP + Socket.IO) is running on port ${SERVER_PORT}`);

  handleAppCleanup();
});