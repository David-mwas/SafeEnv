import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import useAuthToken from "../../hooks/useAuth";
import Login from "./ShareKeyLogin";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FaEye, FaEyeSlash, FaCopy } from "react-icons/fa";
import { motion } from "framer-motion";

function Key() {
  const { key } = useParams();
  const location = useLocation();
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState(false); // Track copy status

  const { getItem } = useAuthToken();
  const { token } = getItem() || { token: null };

  const url = `${import.meta.env.VITE_FRONTEND_URL}${location.pathname}`;
  localStorage.setItem("sharelink", url);

  // Fetch shared key details
  const { data } = useQuery({
    queryKey: ["sharedEnvVar", key],
    queryFn: async () => {
      if (!token) return null;
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/share/retrieve/${key}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    enabled: !!token,
  });

  // Copy key to clipboard
  const copyToClipboard = () => {
    if (data?.value) {
      navigator.clipboard.writeText(data.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900 text-white">
      {token ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl"
        >
          <h1 className="text-3xl font-bold mb-4 text-center">
            Shared Key Details
          </h1>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-700 p-2">Key</th>
                  <th className="border border-gray-700 p-2">Value</th>
                  <th className="border border-gray-700 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data ? (
                  <tr className="text-center bg-gray-800 hover:bg-gray-700">
                    <td className="border border-gray-700 p-2">{data.key}</td>
                    <td className="border border-gray-700 p-2">
                      {showValue ? `${data.value.slice(0, 5)}...` : "••••••••"}
                    </td>
                    <td className="border border-gray-700 p-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setShowValue(!showValue)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      >
                        {showValue ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <FaCopy /> {copied ? "Copied!" : "Copy"}
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-400">
                      No shared key found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default Key;
