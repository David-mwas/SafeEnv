import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!username || !email || !password || !confirmPassword) {
      setLoading(false);
      setError("All fields are required!");

      return;
    }
    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, email, password }),
        }
      );
      if (response.ok) {
        navigate("/sharelogin"); // Redirect to login after success
      }
    } catch (err) {
      setError("Registration failed. Try again." + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <motion.form
        className="bg-gray-800 p-6 rounded-xl shadow-lg w-96"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={(e) => handleRegister(e)}
      >
        <h1 className="text-2xl font-bold text-center mb-4">Register</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border "
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border  "
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border "
        />
        <input
          type="password"
          placeholder="Confirm Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mt-6 text-white rounded placeholder:text-white border "
        />

        <button
          className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => navigate("/sharelogin")}
          >
            {" "}
            Login
          </span>
        </p>
      </motion.form>
    </div>
  );
}

export default Register;
