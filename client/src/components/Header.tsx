import { motion } from "framer-motion";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import img from "/safeenv-high-resolution-logo-removebg-preview.png";
import useAuthToken from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import NavBar from "./NavBar";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const { getItem, clearAuthToken } = useAuthToken();
  const { token } = getItem() || { user: null, token: null };

  const { data } = useQuery({
    queryKey: ["envVars"],
    queryFn: async () => {
      if (!token) return { keys: [] };
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  console.log(data);

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  return (
    <header className="w-full flex items-center justify-between bg-gray-800 px-6 py-4 shadow-md h-[80px] mb-8 fixed top-0 z-50  ">
      {/* Logo */}
      <motion.img
        src={img}
        alt="SafeEnv Logo"
        className="w-[200px] h-auto object-contain"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      />
      {/* <div>
        <span>
          <FaMoon />
        </span>
        <span>light</span>
        <FaSun/>
      </div> */}
      <div
        className="block sm:hidden"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        {!isOpen ? (
          <FaBars className="text-2xl" />
        ) : (
          <FaTimes className="text-2xl" />
        )}
      </div>
      {isOpen && <NavBar data={data} handleLogout={handleLogout} />}

      {/* Profile & Logout */}
      <div className="sm:flex items-center gap-4 hidden">
        <div className="flex items-center gap-2">
          <FaUserCircle className="text-4xl text-white" />
          <div>
            <span className="text-white text-sm capitalize">
              Hello, <b>{data?.username || "Guest"}</b>
            </span>
            <p className="text-sm text-gray-300">{data?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 px-8 py-2 text-white rounded-md hover:bg-red-600 transition ml-4 hidden sm:flex"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
