import { useEffect, useState } from "react";
import API from "../services/api";

/* Displays like/follow notifications */
export default function Notifications() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    API.get("/notifications").then(res => setNotes(res.data));
  }, []);

  return (
    <div className="container">
      <h2>Notifications</h2>

      {notes.map(n => (
        <div className="card" key={n._id}>
          {n.type.replace("_", " ")}
        </div>
      ))}
    </div>
  );
}
