import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FiSend } from "react-icons/fi";
import API from "../services/api";
import socket from "../services/socket";

/* One-to-one chat page */
export default function Chat() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    API.get(`/chat/${id}`)
      .then(res => {
        setMessages(res.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
      });

    socket.on("receiveMessage", msg => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receiveMessage");
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    const payload = JSON.parse(atob(localStorage.getItem("token").split(".")[1]));

    socket.emit("sendMessage", {
      sender: payload.id,
      receiver: id,
      text
    });

    setMessages([...messages, { sender: payload.id, text }]);
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 mt-16">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="bg-white rounded-lg shadow h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 mt-16">
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Chat Header */}
        <div className="bg-indigo-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Chat</h2>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((m, i) => {
              const isCurrentUser = m.sender === currentUserId;
              return (
                <div
                  key={i}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isCurrentUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 shadow rounded-bl-none'
                      }`}
                  >
                    <p className="break-words">{m.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <form onSubmit={send} className="flex items-center space-x-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              onClick={send}
              disabled={!text.trim()}
              className={`p-3 rounded-full transition-colors ${text.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <FiSend className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
