
import { Link } from 'react-router-dom';
import { FiLogIn, FiUserPlus } from 'react-icons/fi';
import { FaHeart, FaComment, FaShare, FaUserFriends } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-peach-light/20">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-10 w-10 rounded-xl bg-peach flex items-center justify-center text-white font-bold text-xl shadow-md">
                  <span>T</span>
                </div>
                <span className="ml-3 text-2xl font-bold text-charcoal tracking-tight">ToCoMo</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-stone-600 hover:text-peach-dark px-4 py-2 rounded-full text-base font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-peach text-white px-5 py-2.5 rounded-full text-base font-semibold hover:bg-peach-dark shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-charcoal mb-6 tracking-tight">
            Together Connect <span className="text-peach-dark">Moments</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            "Together in Every Moment" - Share your life's special moments with the people who matter most.
          </p>

          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-full text-white bg-peach hover:bg-peach-dark shadow-lg hover:shadow-peach/40 transition-all active:scale-95"
            >
              <FiUserPlus className="mr-2" /> Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-8 py-3.5 border border-transparent text-lg font-medium rounded-full text-peach-dark bg-white border-peach-light/50 hover:bg-cream hover:border-peach transition-all active:scale-95"
            >
              <FiLogIn className="mr-2" /> Login
            </Link>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Connect and Share Like Never Before
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-peach-light/30 rounded-2xl flex items-center justify-center mb-6">
                <FaHeart className="text-peach text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Share Your Moments</h3>
              <p className="text-gray-600">Post updates, photos, and videos with your friends and family.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-peach-light/30 rounded-2xl flex items-center justify-center mb-6">
                <FaComment className="text-peach text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stay Connected</h3>
              <p className="text-gray-600">Like, comment, and engage with posts from people you follow.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-peach-light/30 rounded-2xl flex items-center justify-center mb-6">
                <FaUserFriends className="text-peach text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Network</h3>
              <p className="text-gray-600">Follow friends and discover new connections around the world.</p>
            </div>
          </div>
        </div>

        {/* Sample Posts Preview (Blurred) */}
        <div className="mt-20">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            See What's Happening
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="relative group">
                <div className="bg-white rounded-lg overflow-hidden shadow-md h-64">
                  <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 filter blur-sm"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black bg-opacity-50 text-white p-4 rounded-lg text-center">
                    <p>Sign up to see this post and more</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white mt-20">
        <div className="max-w-7xl mx-auto py-8 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} ToCoMo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
