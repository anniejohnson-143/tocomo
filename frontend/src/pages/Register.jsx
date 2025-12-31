import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock, FiArrowRight, FiCamera, FiAlertCircle } from "react-icons/fi";
import API from "../services/api";

const Logo = () => (
  <svg height="48" viewBox="0 0 48 48" width="48" xmlns="http://www.w3.org/2000/svg">
    <path d="M 12 12 H 36 V 18 H 24 V 36 H 18 V 18 H 12 Z" fill="white" />
  </svg>
);

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("fullName", formData.fullName);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      if (profilePicture) {
        formDataToSend.append("profilePicture", profilePicture);
      }

      const res = await API.post("/auth/register", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        // Fallback if backend doesn't return user immediately
        console.warn("User data not returned from backend");
      }
      window.dispatchEvent(new Event('storage'));
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background shapes - subtle for light theme */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-peach/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-peach-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse animation-delay-4000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-peach flex items-center justify-center text-white shadow-md transform hover:rotate-12 transition-transform">
            <span className="text-2xl font-bold">T</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Join the Community
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already a member?{' '}
          <Link to="/login" className="font-medium text-peach-dark hover:text-peach-dark/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-lg shadow-xl shadow-peach/10 sm:rounded-2xl py-8 px-4 sm:px-10 border border-white/50">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
              <FiAlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex justify-center">
              <div className="relative group">
                <div className="h-28 w-28 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center transition-all group-hover:border-peach group-hover:bg-cream">
                  {preview ? (
                    <img src={preview} alt="Profile preview" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <FiUser className="h-12 w-12 text-stone-400 transition-all group-hover:text-peach" />
                  )}
                </div>
                <label
                  htmlFor="profile-picture"
                  className="absolute inset-0 bg-transparent rounded-full flex items-center justify-center cursor-pointer"
                >
                  <div className="absolute bottom-0 right-0 bg-peach rounded-full p-2 text-white transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform shadow-sm">
                    <FiCamera className="h-4 w-4" />
                  </div>
                  <input
                    id="profile-picture"
                    name="profile-picture"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-white border border-stone-200 focus:border-peach focus:ring-peach block w-full pl-12 pr-4 sm:text-sm rounded-md h-12 placeholder-gray-400 transition-shadow"
                  placeholder="johndoe123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-white border border-stone-200 focus:border-peach focus:ring-peach block w-full pl-12 pr-4 sm:text-sm rounded-md h-12 placeholder-gray-400 transition-shadow"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white border border-stone-200 focus:border-peach focus:ring-peach block w-full pl-12 pr-4 sm:text-sm rounded-md h-12 placeholder-gray-400 transition-shadow"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-white border border-stone-200 focus:border-peach focus:ring-peach block w-full pl-12 pr-4 sm:text-sm rounded-md h-12 placeholder-gray-400 transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength="6"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-white border border-stone-200 focus:border-peach focus:ring-peach block w-full pl-12 pr-4 sm:text-sm rounded-md h-12 placeholder-gray-400 transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-peach bg-white border-stone-300 rounded focus:ring-peach"
              />
              <label htmlFor="terms" className="ml-3 block text-sm text-gray-500">
                I agree to the{' '}
                <a href="#" className="font-medium text-peach-dark hover:text-peach-dark/80 underline">
                  Terms of Service
                </a>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-lg text-white text-sm font-medium bg-peach hover:bg-peach-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-peach h-12 transition-all duration-300 ease-in-out
                  ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-peach/40'}`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Create Account <FiArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
