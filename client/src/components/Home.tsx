import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

import useAuthToken from "../../hooks/useAuth";

import Header from "./Header";
import StroreKeysForm from "./StroreKeysForm";
import TableData from "./TableData";
import toast from "react-hot-toast";
import { SparklesText } from "./magicui/sparkles-text";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIstEditModalOpen] = useState(false); 

  const [retrievedKeys, setRetrievedKeys] = useState<{ [key: string]: string }>(
    {}
  );

  const [shareableLinks, setShareableLinks] = useState<{
    [key: string]: string;
  }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { getItem, clearAuthToken } = useAuthToken();
  const { token } = getItem() || { token: null };

  // Fetch stored keys
  const {
    data,
    refetch,
    isLoading: isLoadingKeys,
  } = useQuery({
    queryKey: ["key"],
    queryFn: async () => {
      if (!token) return { keys: [] };
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();

        return data;
      }
      if (res.status == 401) {
        toast.error("Session expired, please login again");
        clearAuthToken();
        window.location.href = "/login";
        return;
      }

      if (res.status == 404) {
        toast.error("No keys found, create one");
        return { keys: [] };
      }
    },
    enabled: !!token,
  });

  // console.log(data?.keys[0]?._id);

  // Store new key
  const mutation = useMutation({
    mutationFn: async (newVar: { key: string; value: string }) => {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/store`, newVar, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => refetch(),
  });
  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/keys/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      refetch();
      toast.success("Key deleted successfully");
    },
  });

  const handleDeleteKey = (id:string,key: string) => {
    const data = prompt(
      "To delete key " + key + " Type: I want to delete key " + key
    );
    const str = "I want to delete key " + key;
    if (!data) {
      toast.error("You never typed anything " + str);
      return;
    }

    if (data?.toLocaleLowerCase() == str?.toLocaleLowerCase()) {
      deleteMutation.mutate(id);
    } else {
      toast.error("Wrong!! " + str);
      return;
    }
  };

  // Handle form submission
  const handleStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!envkey || !value) return;
    mutation.mutate({ key: envkey, value });
    setKey("");
    setValue("");
    setIsModalOpen(false);
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

      // setRetrievedKeys(() => ({ [keyID]: res.data.value })); // Store retrieved value
      setRetrievedKeys((prev) => ({ ...prev, [keyID]: res.data.value }));
    } catch (error) {
      console.error("Error retrieving key:", error);
    }
  };

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


  const openEditModal = () => {
    setIstEditModalOpen(!isEditModalOpen);
  };

  return (
    <div className="w-screen  flex flex-col items-center p-6 bg-gray-900 text-white pt-[100px] pb-[30px]">
      <Header />
    
      <b className="w-full max-w-4xl ">
      <SparklesText text="Store your environment variables securely." className="text-left text-3xl mb-8 animate-pulse w-full max-w-4xl font-extrabold" sparklesCount={10} colors={
        {
          first: "#4CAF50",
          second: "#2196F3",
        }
      }/>
      </b>

      {/* star us on github */}
      <div className="w-full max-w-4xl flex  gap-2">
      <a
      target="_blank"
      rel="noreferrer"
          href="https://github.com/David-mwas/SafeEnv" className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition justify-center">
      <p className="text-base  text-gray-200">
       Star on GitHub
      </p>
       
          <img
            src="https://img.shields.io/github/stars/David-mwas/SafeEnv?style=social"
            alt="Star on GitHub"/>
            </a>
        
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
        className="w-full max-w-4xl"
      >
        <div className="overflow-x-auto overflow-y-auto">
          <TableData
            data={data}
            retrievedKeys={retrievedKeys}
            retrieveKey={retrieveKey}
            copyToClipboard={copyToClipboard}
            copiedKey={copiedKey}
            shareableLinks={shareableLinks}
            shareKey={shareKey}
            handleDeleteKey={handleDeleteKey}
            isEditModalOpen={isEditModalOpen}
            setIstEditModalOpen={setIstEditModalOpen}
            openEditModal={openEditModal}
            refetch={refetch}
            token={token}
            isLoadingKeys={isLoadingKeys}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      </motion.div>
     
    </div>
  );
}

export default Home;
