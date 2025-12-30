import { useEffect, useState } from "react";
import { FiHeart, FiUserPlus, FiMessageSquare, FiBell } from "react-icons/fi";
import API from "../services/api";

/* Displays like/follow notifications */
export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    API.get("/notifications")
      .then(res => {
        setNotes(res.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
      });
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FiHeart className="h-5 w-5 text-red-500" />;
      case 'follow':
        return <FiUserPlus className="h-5 w-5 text-blue-500" />;
      case 'comment':
        return <FiMessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <FiBell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatNotificationType = (type) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 mt-16">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h2>

      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiBell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">When you get notifications, they'll show up here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(n => (
            <div
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-indigo-500"
              key={n._id}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">
                    {formatNotificationType(n.type)}
                  </p>
                  {n.message && (
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  )}
                  {n.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
