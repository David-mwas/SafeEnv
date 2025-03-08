import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Check your email for the reset link.");
      } else {
        setMessage(data.error || "Failed to send reset email.");
      }
    } catch (error) {
      setMessage("Server error. Try again later.");
    }finally{
        setLoading(false);
        setEmail("")
    }


  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-semibold mb-4">Forgot Password?</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
        </form>
      </div>
    </div>
  );
}
