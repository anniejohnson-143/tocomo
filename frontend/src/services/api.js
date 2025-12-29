import axios from "axios";

/* Axios instance for backend API */
const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

/* Automatically attach token for protected routes */
API.interceptors.request.use(req => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = token;
  return req;
});

export default API;
