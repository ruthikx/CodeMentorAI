import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "8000", 10);
const app = createApp();
const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { ok: true });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on http://0.0.0.0:${port}`);
});
