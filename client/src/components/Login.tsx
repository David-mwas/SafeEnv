import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!email || !password) {
      setLoading(false);
      setError("All fields are required!");

      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/login`,
        {
          email,
          password,
        }
      );
      console.log(res);
      if (res.statusText === "OK") {
        console.log(res);
        localStorage.setItem("safeEnv", res.data.token);
        window.location.href = "/";
      }
    } catch (err) {
      setError("Invalid Email or password " + err);
    } finally {
      setLoading(false);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <motion.form
        className="bg-gray-800 p-6 rounded-xl shadow-lg w-96"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={(e) => handleLogin(e)}
      >
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border"
        />

        <button
          type="submit"
          className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account?
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => navigate("/register")}
          >
            {" "}
            Register
          </span>
        </p>
      </motion.form>
    </div>
  );
}

export default Login;
