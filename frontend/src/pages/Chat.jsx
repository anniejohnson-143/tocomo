import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";

/* One-to-one chat page */
export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    API.get(`/chat/${id}`).then(res => setMessages(res.data));

    socket.on("receiveMessage", msg => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, [id]);

  const send = () => {
    const payload = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));

    socket.emit("sendMessage", {
      sender: payload.id,
      receiver: id,
      text
    });

    setMessages([...messages, { sender: payload.id, text }]);
    setText("");
  };

  return (
    <div className="container">
      <h2>Chat</h2>

      {messages.map((m, i) => (
        <div key={i}>{m.text}</div>
      ))}

      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}
