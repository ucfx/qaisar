import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("userConnected", socket.id);
  socket.on("disconnect", () => {
    console.log("userDisconnect", socket.id);
  });

  socket.on("ping", (callback) => {
    callback();
  });
});

export { app, io, server };
