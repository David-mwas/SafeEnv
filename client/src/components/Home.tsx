import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { convertDateTime } from "../../hooks/useDateTime";
import useAuthToken from "../../hooks/useAuth";
import { FaCopy, FaEye, FaShareAlt } from "react-icons/fa";

export type Key = {
  _id: string;
  key: string;
  value: string; // Encrypted value
  createdAt: string;
  userID: string;
};

function Home() {
  const [key, setKey] = useState("");
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
    if (!key || !value) return;
    mutation.mutate({ key, value });
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

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-900 text-white">
      <motion.h1
        className="text-3xl font-bold mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        SafeEnv
      </motion.h1>

      {/* Form to store new key */}
      <div className="w-full max-w-md">
        <form onSubmit={handleStore} className="mb-4">
          <input
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key"
            className="w-full p-2 mt-4 text-white rounded placeholder:text-white border"
          />
          <input
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            className="w-full p-2 mt-4 text-white rounded placeholder:text-white border"
          />
          <button
            type="submit"
            className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
          >
            Store
          </button>
        </form>
      </div>

      {/* Table to display stored keys */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-3xl"
      >
        <h2 className="text-xl mb-2">Stored Variables</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-700">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border border-gray-700 p-2">Key</th>
                <th className="border border-gray-700 p-2">Created At</th>
                <th className="border border-gray-700 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.keys?.length ? (
                data.keys.map((envVar: Key) => (
                  <tr
                    key={envVar._id}
                    className="text-center bg-gray-800 hover:bg-gray-700"
                  >
                    <td className="border border-gray-700 p-2">{envVar.key}</td>
                    <td className="border border-gray-700 p-2">
                      {convertDateTime(envVar.createdAt)}
                    </td>
                    <td className="border border-gray-700 p-2 flex items-center justify-center gap-2">
                      {/* Retrieve Key */}

                      {!retrievedKeys[envVar.key] && (
                        <button
                          onClick={() => retrieveKey(envVar.key)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                        >
                          <FaEye className="inline mr-1" /> Retrieve
                        </button>
                      )}

                      {/* Copy Key */}
                      {retrievedKeys[envVar.key] && (
                        <button
                          onClick={() => copyToClipboard(envVar.key)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                        >
                          <FaCopy className="inline mr-1" />
                          {copiedKey === envVar.key ? "Copied!" : "Copy"}
                        </button>
                      )}
                      <button
                        onClick={() => shareKey(envVar.key)}
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                      >
                        <FaShareAlt className="inline mr-1" /> Share
                      </button>
                    </td>
                    <td className="border border-gray-700 p-2 flex items-center justify-center gap-2">
                      {shareableLinks[envVar.key] && (
                        <a
                          className="text-sm text-green-400"
                          href={shareableLinks[envVar.key]}
                        >
                          {shareableLinks[envVar.key].slice(0, 24)}...
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-400">
                    No keys found, create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;

// import { useState } from "react";
// import { motion } from "framer-motion";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import axios from "axios";
// import { convertDateTime } from "../../hooks/useDateTime";
// import useAuthToken from "../../hooks/useAuth";
// import { FaCopy, FaEye, FaShareAlt } from "react-icons/fa";

// export type Key = {
//   _id: string;
//   key: string;
//   value: string; // Encrypted value
//   createdAt: string;
//   userID: string;
// };

// function Home() {
//   const [key, setKey] = useState("");
//   const [value, setValue] = useState("");
//   const [retrievedKeys, setRetrievedKeys] = useState<{ [key: string]: string }>(
//     {}
//   );
//   const [copiedKey, setCopiedKey] = useState<string | null>(null);
//   const [shareableLinks, setShareableLinks] = useState<{
//     [key: string]: string;
//   }>({});

//   const { getItem } = useAuthToken();
//   const { token } = getItem() || { token: null };

//   // Fetch stored keys
//   const { data, refetch } = useQuery({
//     queryKey: ["envVars"],
//     queryFn: async () => {
//       if (!token) return { keys: [] };
//       const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/keys`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return res.data;
//     },
//     enabled: !!token,
//   });

//   // Store new key
//   const mutation = useMutation({
//     mutationFn: async (newVar: { key: string; value: string }) => {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/store`, newVar, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//     },
//     onSuccess: () => refetch(),
//   });

//   // Handle form submission
//   const handleStore = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!key || !value) return;
//     mutation.mutate({ key, value });
//     setKey("");
//     setValue("");
//   };

//   // Retrieve decrypted key from backend
//   const retrieveKey = async (keyID: string) => {
//     if (!token) return;
//     try {
//       const res = await axios.get(
//         `${import.meta.env.VITE_BACKEND_URL}/retrieve/${keyID}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setRetrievedKeys((prev) => ({ ...prev, [keyID]: res.data.value }));
//     } catch (error) {
//       console.error("Error retrieving key:", error);
//     }
//   };

//   // Generate a shareable link for a key
//   const shareKey = async (keyID: string) => {
//     if (!token) return;
//     try {
//       const res = await axios.post(
//         `${import.meta.env.VITE_BACKEND_URL}/share`,
//         { key: keyID },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setShareableLinks((prev) => ({ ...prev, [keyID]: res.data.link }));
//     } catch (error) {
//       console.error("Error generating shareable link:", error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center p-6 bg-gray-900 text-white">
//       <motion.h1
//         className="text-3xl font-bold mb-4"
//         initial={{ y: -20, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//       >
//         SafeEnv
//       </motion.h1>

//       {/* Form to store new key */}
//       <div className="w-full max-w-md">
//         <form onSubmit={handleStore} className="mb-4">
//           <input
//             required
//             value={key}
//             onChange={(e) => setKey(e.target.value)}
//             placeholder="Key"
//             className="w-full p-2 mt-4 text-white rounded placeholder:text-white border"
//           />
//           <input
//             required
//             value={value}
//             onChange={(e) => setValue(e.target.value)}
//             placeholder="Value"
//             className="w-full p-2 mt-4 text-white rounded placeholder:text-white border"
//           />
//           <button
//             type="submit"
//             className="w-full mt-4 bg-green-600 py-2 rounded hover:bg-green-700 transition"
//           >
//             Store
//           </button>
//         </form>
//       </div>

//       {/* Table to display stored keys */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         className="w-full max-w-3xl"
//       >
//         <h2 className="text-xl mb-2">Stored Variables</h2>
//         <div className="overflow-x-auto">
//           <table className="w-full border-collapse border border-gray-700">
//             <thead>
//               <tr className="bg-gray-800 text-white">
//                 <th className="border border-gray-700 p-2">Key</th>
//                 <th className="border border-gray-700 p-2">Created At</th>
//                 <th className="border border-gray-700 p-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data?.keys?.length ? (
//                 data.keys.map((envVar: Key) => (
//                   <tr
//                     key={envVar._id}
//                     className="text-center bg-gray-800 hover:bg-gray-700"
//                   >
//                     <td className="border border-gray-700 p-2">{envVar.key}</td>
//                     <td className="border border-gray-700 p-2">
//                       {convertDateTime(envVar.createdAt)}
//                     </td>
//                     <td className="border border-gray-700 p-2 flex items-center justify-center gap-2">
//                       <button
//                         onClick={() => retrieveKey(envVar.key)}
//                         className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
//                       >
//                         <FaEye className="inline mr-1" /> Retrieve
//                       </button>
//                       <button
//                         onClick={() => shareKey(envVar.key)}
//                         className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
//                       >
//                         <FaShareAlt className="inline mr-1" /> Share
//                       </button>
//                       {shareableLinks[envVar.key] && (
//                         <span className="text-sm text-green-400">
//                           {shareableLinks[envVar.key]}
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={3} className="p-4 text-center text-gray-400">
//                     No keys found, create one.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// export default Home;
