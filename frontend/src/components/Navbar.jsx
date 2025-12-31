import { Link, useNavigate } from "react-router-dom";
import { FiHome, FiUser, FiBell, FiMessageSquare, FiSearch, FiLogOut } from "react-icons/fi";
import API from "../services/api";

/* Top navigation bar */
export default function Navbar() {
  const navigate = useNavigate();
  let user = {};
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Failed to parse user from local storage", e);
  }

  const handleLogout = async () => {
    try {
      await API.get("/auth/logout");
    } catch (e) {
      console.warn("Logout failed on backend", e);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event('storage'));
    navigate("/");
  };

  return (
    <nav className="bg-cream/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/home" className="flex items-center">
              <div className="h-8 w-8 rounded-xl bg-peach flex items-center justify-center text-white shadow-sm transform transition-transform hover:scale-110">
                <span className="text-xl font-bold">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-charcoal hidden sm:inline tracking-tight">ToCoMo</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-stone-200 rounded-full leading-5 bg-white/50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-peach focus:border-peach sm:text-sm transition-all duration-200"
                  placeholder="Search..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center
          ">
            <div className="flex-shrink-0 flex items-center space-x-4">
              <Link
                to="/home"
                className="text-stone-500 hover:text-peach transition-colors px-3 py-2 rounded-full hover:bg-peach/10"
                title="Home"
              >
                <FiHome className="h-6 w-6" />
              </Link>

              <Link
                to="/notifications"
                className="text-stone-500 hover:text-peach transition-colors px-3 py-2 rounded-full hover:bg-peach/10 relative"
                title="Notifications"
              >
                <FiBell className="h-6 w-6" />
                <span className="absolute top-2 right-2 inline-block w-2.5 h-2.5 bg-peach-dark rounded-full border-2 border-white"></span>
              </Link>

              <Link
                to="/messages"
                className="text-stone-500 hover:text-peach transition-colors px-3 py-2 rounded-full hover:bg-peach/10"
                title="Messages"
              >
                <FiMessageSquare className="h-6 w-6" />
              </Link>

              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className="bg-transparent flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-peach transition-shadow"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    {user.profilePicture ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.profilePicture}
                        alt={user.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-peach-light text-peach-dark border border-peach/20 flex items-center justify-center font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </button>
                </div>

                {/* Profile dropdown */}
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    <span className="flex items-center">
                      <FiLogOut className="mr-2" /> Sign out
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
