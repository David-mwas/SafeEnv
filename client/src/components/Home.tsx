import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import useAuthToken from "../../hooks/useAuth";
export type Key = {
  key: string;
  value: string;
};

function Home() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const { getItem } = useAuthToken();
  const { token } = getItem();

  const { data, refetch } = useQuery({
    queryKey: ["envVars"],
    queryFn: async () => {
      if (!token) return [];
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: async (newVar) => {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/store`, newVar, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => refetch(),
  });

  const handleStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!key || !value) {
      return;
    }

    mutation.mutate({ key, value });
    setKey("");
    setValue("");
  };

  console.log(data);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-900 text-white">
      <motion.h1
        className="text-3xl font-bold mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        SafeEnv
      </motion.h1>

      <div className="w-full max-w-md">
        <form onSubmit={(e) => handleStore(e)} className="mb-4">
          <input
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key"
            className="w-full p-2 mt-6 text-white rounded placeholder:text-white border"
          />
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="w-full p-2 mt-6 text-white rounded placeholder:text-white border"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          >
            Store
          </button>
        </form>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl">Stored Variables</h2>
          <ul>
            {data?.keys ? (
              data?.keys?.map((envVar: Key) => (
                <li key={envVar?.key} className="border-b p-2">
                  {envVar?.key}: {envVar?.value.slice(0, 12)}...
                </li>
              ))
            ) : (
              <p>No keys found , create one</p>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
