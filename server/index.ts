import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import { initializeCommands, runCommand } from "@/lib/commands";
import CommandRoute from "@/routes/command.route";
import DirRoute from "@/routes/dir.route";
import AppError from "@/util/AppError";
const PORT = 5000;

// Extend Express Request type to include io
declare global {
  namespace Express {
    interface Request {
      io: Server;
    }
  }
}

const app = express();
const server = createServer(app);
const io = new Server(server);

export const rooms = new Map<string, string[]>();

io.on("connection", (socket) => {
  console.log("userConnected", socket.id);
  socket.on("disconnect", () => {
    console.log("userDisconnect", socket.id);
  });

  socket.on("join-room", (room) => {
    for (let [room, sockets] of rooms) {
      if (sockets.includes(socket.id)) {
        socket.leave(room);
        rooms.set(
          room,
          sockets.filter((id) => id !== socket.id)
        );
        console.log(`User ${socket.id} left room '${room}'`);
      }
    }
    if (!rooms.has(room)) {
      rooms.set(room, []);
    }
    rooms.get(room)?.push(socket.id);
    socket.join(room);
    console.log(`User ${socket.id} joined to room '${room}'`);
    io.to(socket.id).emit("joined", `Joined to room '${room}'`);
  });

  socket.on("leave-room", (room) => {
    if (rooms.has(room)) {
      socket.leave(room);
      rooms.set(
        room,
        rooms.get(room)?.filter((id) => id !== socket.id) || []
      );
      console.log(`User ${socket.id} left room '${room}' - MAX EMITS`);
      io.to(socket.id).emit("left-room", 'You reached the max log emits');
    }
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

app.use("/commands", CommandRoute);
app.use("/open-dir", DirRoute);
app.use(
  (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status).json({ success: false, message: err.message });
  }
);

server.listen(PORT, async () => {
  await initializeCommands();
  console.log(`Server is running on port ${PORT}`);
});
