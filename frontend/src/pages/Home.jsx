import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiMessageSquare, FiShare2, FiImage, FiX, FiMoreHorizontal } from "react-icons/fi";
import { formatDistanceToNow } from 'date-fns';
import API from "../services/api";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};

  // Load feed
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/posts");
        setPosts(res.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch posts function (used to reload posts)
  const fetchPosts = async () => {
    try {
      const res = await API.get("/posts");
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Create post with image
  const createPost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    const formData = new FormData();
    formData.append("content", content.trim());
    if (image) formData.append("image", image);

    try {
      await API.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setContent("");
      setImage(null);
      setImagePreview("");
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  // Like or unlike a post
  const toggleLike = async (postId) => {
    try {
      await API.post(`/posts/like/${postId}`);
      setPosts(posts.map(post =>
        post._id === postId
          ? {
            ...post,
            likes: post.isLiked
              ? post.likes.filter(like => like.user !== user._id)
              : [...post.likes, { user: user._id }],
            isLiked: !post.isLiked
          }
          : post
      ));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Add comment to a post
  const addComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    await API.post(`/posts/comment/${postId}`, { text });
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    fetchPosts();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="mt-4 h-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Create Post */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 mb-6 transition-shadow hover:shadow-md">
        <div className="flex items-start space-x-3">
          <Link to={`/profile/${user._id}`} className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-peach-light flex items-center justify-center text-peach-dark font-bold text-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </Link>
          <form onSubmit={createPost} className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full border-0 focus:ring-0 resize-none text-gray-900 placeholder-gray-500 text-sm sm:text-base"
              rows="3"
            />

            {imagePreview && (
              <div className="mt-2 relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-stone-400 hover:text-peach transition-colors"
                >
                  <FiImage className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <button
                type="submit"
                disabled={!content.trim() && !image}
                className={`px-6 py-2 rounded-full text-sm font-bold text-white transition-all transform active:scale-95 ${!content.trim() && !image ? 'bg-peach/50 cursor-not-allowed' : 'bg-peach hover:bg-peach-dark shadow-sm hover:shadow-md'
                  }`}
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
          <p className="mt-1 text-sm text-gray-500">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link to={`/profile/${post.user._id}`} className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-peach-light flex items-center justify-center text-peach-dark font-bold">
                        {post.user.name ? post.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </Link>
                    <div>
                      <Link to={`/profile/${post.user._id}`} className="font-bold text-charcoal hover:text-peach-dark transition-colors">
                        {post.user.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <FiMoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="mt-3 text-gray-800">
                  <p>{post.content}</p>
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <img
                      src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${post.image}`}
                      alt="Post"
                      className="w-full h-auto max-h-96 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="mt-3 flex items-center justify-between text-gray-500">
                  <button
                    onClick={() => toggleLike(post._id)}
                    className={`flex items-center space-x-1 ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                  >
                    <FiHeart className="h-5 w-5" />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentBox(activeCommentBox === post._id ? null : post._id)}
                    className="flex items-center space-x-1 hover:text-peach transition-colors"
                  >
                    <FiMessageSquare className="h-5 w-5" />
                    <span>{post.comments?.length || 0}</span>
                  </button>
                  <button className="flex items-center space-x-1 hover:text-green-600">
                    <FiShare2 className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className={`mt-3 pt-3 border-t ${activeCommentBox === post._id ? 'block' : 'hidden'}`}>
                  {/* Comment Input */}
                  <div className="flex items-start space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 flex">
                      <input
                        type="text"
                        value={commentInputs[post._id] || ''}
                        onChange={(e) =>
                          setCommentInputs(prev => ({
                            ...prev,
                            [post._id]: e.target.value
                          }))
                        }
                        placeholder="Write a comment..."
                        className="flex-1 border-0 border-b border-stone-200 focus:border-peach focus:ring-0 px-0 py-1 text-sm bg-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post._id)}
                      />
                      <button
                        onClick={() => addComment(post._id)}
                        className="ml-2 text-peach-dark font-bold text-sm hover:text-peach"
                      >
                        Post
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {post.comments?.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment._id} className="flex items-start space-x-2">
                          <Link to={`/profile/${comment.user._id}`} className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-peach-light flex items-center justify-center text-xs text-peach-dark font-bold">
                              {comment.user.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          </Link>
                          <div className="bg-stone-50 rounded-2xl px-4 py-2 flex-1">
                            <div className="flex items-center">
                              <Link to={`/profile/${comment.user._id}`} className="font-medium text-sm">
                                {comment.user.name}
                              </Link>
                              <span className="mx-1 text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 mt-1">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
