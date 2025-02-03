import { motion } from "framer-motion";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import img from "../../../asssets/safeenv-high-resolution-logo-removebg-preview.png";
import useAuthToken from "../../hooks/useAuth";

function Header() {
  const navigate = useNavigate();
  const { getItem, clearAuthToken} = useAuthToken();
  // const { token } = getItem() || { user: null, token: null };

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  return (
    <header className="w-full flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md h-[80px] mb-8 fixed top-0 z-50">
      {/* Logo */}
      <motion.img
        src={img}
        alt="SafeEnv Logo"
        className="w-[180px] h-auto object-contain"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      />

      {/* Profile & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-2xl text-white" />
          <span className="text-white text-sm">{ "Guest"}</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 px-4 py-2 text-white rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
