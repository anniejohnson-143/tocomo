import { useEffect, useState } from "react";
import API from "../services/api";

/*
 Profile Page:
 - Shows user's own posts
 - Edit post
 - Delete post
*/
export default function Profile() {
  const [posts, setPosts] = useState([]);
  const userId = JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id;

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    const res = await API.get(`/posts/user/${userId}`);
    setPosts(res.data);
  };

  /* Delete post */
  const deletePost = async (id) => {
    await API.delete(`/posts/${id}`);
    fetchMyPosts();
  };

  /* Edit post content */
  const editPost = async (id, oldContent) => {
    const newContent = prompt("Edit post", oldContent);
    if (!newContent || !newContent.trim()) return;

    await API.put(`/posts/${id}`, { content: newContent });
    fetchMyPosts();
  };

  return (
    <div className="container">
      <h2>My Posts</h2>

      {posts.map(post => (
        <div className="postCard" key={post._id}>
          <p>{post.content}</p>

          {post.image && (
            <img src={post.image} alt="post" className="postImage" />
          )}

          <button onClick={() => editPost(post._id, post.content)}>
            Edit
          </button>
          <button onClick={() => deletePost(post._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
