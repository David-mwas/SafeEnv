import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import { FlipText } from "./magicui/flip-text";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      if (res.status == 200) {
        toast.success("Login successful");
        localStorage.setItem("safeEnv", res.data.token);
        window.location.href = "/";
      }
      if (res.status == 401) {
        toast.error("Unauthorized, Invalid Email or password");
        setError("Unauthorized, Invalid Email or password");
      }
    } catch (err) {
      setError("Invalid Email or password " + err);
    } finally {
      setLoading(false);
      setEmail("");
      setPassword("");
    }
  };

  const toogleEye = () => {
    setShowPassword(!showPassword);
   }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white overflow-y-hidden">
      <Toaster />
      <motion.form
        className="bg-gray-800 p-6 rounded-xl shadow-lg w-96"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={(e) => handleLogin(e)}
      >
     
        <FlipText className="-tracking-widest dark:text-white md:text-7xl md:leading-[5rem] text-5xl font-bold text-center mb-4">
      Login
    </FlipText>
     
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <label htmlFor="email" className="text-green-500 font-extrabold text-lg">Email *</label>
       <div className="w-full flex items-center justify-between border rounded mb-6">
       <input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full  text-white  placeholder:text-white p-2 outline-0 border-none"
        />
       
       </div>
       
       <label htmlFor="password" className="text-green-500 font-extrabold text-lg">Password *</label>
        <div className="w-full flex items-center justify-between border  rounded">
        <input
          type={showPassword ? "text" : "password"}
          id="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full  text-white  placeholder:text-white p-2 outline-0 border-none"
        />
        <div className="p-2" onClick={toogleEye}> 
          {showPassword?<FaEye className="w-[20px] h-[20px]"/>:<FaEyeSlash className="w-[20px] h-[20px]"/>}
        </div>
        </div>

        <p className="mt-4 text-sm self-end text-end underline p-2 cursor-pointer" onClick={() => navigate("/forgot-password")}>
        Forgot Password?
          
        </p>

        <button
          type="submit"
          className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" />
              Logging in ...
            </div>
          ) : (
            "Login"
          )}
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
