import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import API from "../services/api";

/*
 Profile Page:
 - Shows user's own posts
 - Edit post
 - Delete post
*/
export default function Profile() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;
  const user = JSON.parse(localStorage.getItem("user")) || {};

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      const res = await API.get(`/posts/user/${userId}`);
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /* Delete post */
  const deletePost = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await API.delete(`/posts/${id}`);
      fetchMyPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  /* Edit post content */
  const editPost = async (id, oldContent) => {
    const newContent = prompt("Edit post", oldContent);
    if (!newContent || !newContent.trim()) return;

    try {
      await API.put(`/posts/${id}`, { content: newContent });
      fetchMyPosts();
    } catch (error) {
      console.error("Error editing post:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 mt-16">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-peach-light flex items-center justify-center text-peach-dark font-bold text-3xl shadow-inner">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">{user.name}</h1>
            <p className="text-stone-500">{user.email}</p>
            <p className="text-sm text-stone-400 mt-1">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Posts</h2>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 text-center">
          <p className="text-gray-500">You haven't posted anything yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 transition-shadow hover:shadow-md" key={post._id}>
              <p className="text-gray-800 mb-3">{post.content}</p>

              {post.image && (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${post.image}`}
                  alt="post"
                  className="w-full max-h-72 object-cover my-2 rounded-lg"
                />
              )}

              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => editPost(post._id, post.content)}
                  className="flex items-center space-x-1 px-4 py-2 bg-peach text-white rounded-full hover:bg-peach-dark transition-all transform active:scale-95 text-sm font-bold shadow-sm"
                >
                  <FiEdit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deletePost(post._id)}
                  className="flex items-center space-x-1 px-4 py-2 bg-red-400 text-white rounded-full hover:bg-red-500 transition-all transform active:scale-95 text-sm font-bold shadow-sm"
                >
                  <FiTrash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
