import { io } from "socket.io-client";

/* Socket connection */
const socket = io("http://localhost:5000");

export default socket;
