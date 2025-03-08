import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { FlipText } from "./magicui/flip-text";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
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
        navigate("/login"); // Redirect to login after success
      }
    } catch (err) {
      setError("Registration failed. Try again." + err);
    } finally {
      setLoading(false);
    }
  };

  const toogleEye = () => {
        setShowPassword(!showPassword);
       }
  const toogleCEye = () => {
        setShowCPassword(!showCPassword);
       }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <motion.form
        className="bg-gray-800 p-6 rounded-xl shadow-lg w-96"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={(e) => handleRegister(e)}
      >
        <h1 className="text-2xl font-bold text-center mb-4">
          <FlipText className="-tracking-widest dark:text-white md:text-7xl md:leading-[5rem] text-5xl font-bold text-center mb-4">
            Register
          </FlipText>
        </h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <label htmlFor="password" className="text-green-500 font-extrabold text-lg">
            Username *
          </label>
        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-6 text-white rounded placeholder:text-white border "
        />
        <label htmlFor="password" className="text-green-500 font-extrabold text-lg">
            Email *
          </label>

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-6 text-white rounded placeholder:text-white border  "
        />

<label htmlFor="password" className="text-green-500 font-extrabold text-lg">
            Password *
          </label>
        <div className="w-full flex items-center justify-between border rounded mb-6 ">
          
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full  text-white  placeholder:text-white p-2 outline-0 border-none "
          />
             <div className="p-2" onClick={toogleEye}> 
                    {showPassword?<FaEye className="w-[20px] h-[20px]"/>:<FaEyeSlash className="w-[20px] h-[20px]"/>}
                  </div>
        </div>

        <label htmlFor="password" className="text-green-500 font-extrabold text-lg">
           Confirm Password *
          </label>

       <div className="w-full flex items-center justify-between border rounded mb-6 ">
          <input
            type={showCPassword ? "text" : "password"}
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full  text-white  placeholder:text-white p-2 outline-0 border-none "
          />
          <div className="p-2" onClick={toogleCEye}> 
                    {showCPassword?<FaEye className="w-[20px] h-[20px]"/>:<FaEyeSlash className="w-[20px] h-[20px]"/>}
                  </div>
       </div>

        <button
          className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Registering...
            </div>
          ) : (
            "Register"
          )}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => navigate("/login")}
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
