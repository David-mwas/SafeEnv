import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

import useAuthToken from "../../hooks/useAuth";

import Header from "./Header";
import StroreKeysForm from "./StroreKeysForm";
import TableData from "./TableData";

export type Key = {
  _id: string;
  key: string;
  value: string; // Encrypted value
  createdAt: string;
  userID: string;
};

function Home() {
  const [envkey, setKey] = useState("");
  const [value, setValue] = useState("");
  const [retrievedKeys, setRetrievedKeys] = useState<{ [key: string]: string }>(
    {}
  );
  const [shareableLinks, setShareableLinks] = useState<{
    [key: string]: string;
  }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { getItem } = useAuthToken();
  const { token } = getItem() || { token: null };

  // Fetch stored keys
  const { data, refetch } = useQuery({
    queryKey: ["envVars"],
    queryFn: async () => {
      if (!token) return { keys: [] };
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!token,
  });

  // Store new key
  const mutation = useMutation({
    mutationFn: async (newVar: { key: string; value: string }) => {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/store`, newVar, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => refetch(),
  });

  // Handle form submission
  const handleStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!envkey || !value) return;
    mutation.mutate({ key: envkey, value });
    setKey("");
    setValue("");
  };

  // Retrieve decrypted key from backend
  const retrieveKey = async (keyID: string) => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/retrieve/${keyID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // console.log("Retrieved key:", res.data.value);
      setRetrievedKeys((prev) => ({ ...prev, [keyID]: res.data.value })); // Store retrieved value
    } catch (error) {
      console.error("Error retrieving key:", error);
    }
  };
  console.log("retrievedKeys", retrievedKeys);
  // Copy retrieved key to clipboard
  const copyToClipboard = (keyID: string) => {
    const value = retrievedKeys[keyID];
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(keyID);

    setTimeout(() => setCopiedKey(null), 2000); // Reset copy state after 2 seconds
  };

  // Generate a shareable link for a key
  const shareKey = async (keyID: string) => {
    if (!token) return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/share`,
        { key: keyID },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShareableLinks((prev) => ({ ...prev, [keyID]: res.data.link }));
    } catch (error) {
      console.error("Error generating shareable link:", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-screen min-h-screen flex flex-col items-center p-6 bg-gray-900 text-white pt-[100px]">
      <Header />
      <p className="text-center text-lg mb-8">
        Store your environment variables securely by encryption.
      </p>
      <div className="flex w-full max-w-3xl justify-end ">
        {/* Button to Open Modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 py-2 px-4 rounded hover:bg-green-700 transition mb-4"
        >
          Add New Key
        </button>
      </div>

      {/* Modal for Storing Key */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
          >
            <h2 className="text-xl mb-2">Store a New Key</h2>
            <StroreKeysForm
              handleStore={handleStore}
              setKey={setKey}
              setValue={setValue}
              envkey={envkey}
              value={value}
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-2 text-white hover:text-white bg-red-500 px-8 py-2"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Table to display stored keys */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-3xl"
      >
        <h2 className="text-xl mb-2">Stored Variables</h2>
        <div className="overflow-x-auto">
          <TableData
            data={data}
            retrievedKeys={retrievedKeys}
            retrieveKey={retrieveKey}
            copyToClipboard={copyToClipboard}
            copiedKey={copiedKey}
            shareableLinks={shareableLinks}
            shareKey={shareKey}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
