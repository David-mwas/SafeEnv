import {
  FaCopy,
  FaEye,
  FaShareAlt,
  FaWhatsapp,
  FaEnvelope,
  FaPencilAlt,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { convertDateTime } from "../../hooks/useDateTime";
import toast, { Toaster } from "react-hot-toast";
import EditKeyForm from "./EditKeyForm";
import { useState } from "react";

interface Key {
  _id: string;
  key: string;
  createdAt: string;
}

interface TableDataProps {
  data: { keys: Key[] };
  retrievedKeys: { [key: string]: string };
  retrieveKey: (key: string) => void;
  copyToClipboard: (key: string) => void;
  copiedKey: string | null;
  shareableLinks: { [key: string]: string };
  shareKey: (key: string) => void;
  handleDeleteKey: (key: string) => void;
  isEditModalOpen: boolean;
  openEditModal: () => void;
  refetch: () => void;
  token: string | null;
}

function TableData({
  data,
  retrievedKeys,
  retrieveKey,
  copyToClipboard,
  copiedKey,
  shareableLinks,
  shareKey,
  handleDeleteKey,
  openEditModal,
  isEditModalOpen,
  refetch,
  token,
}: TableDataProps) {
  const [shareModalKey, setShareModalKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(data.keys.map((envVar) => envVar.key));
    }
    setSelectAll(!selectAll);
  };

  const downloadEnvFile = () => {
    if (selectedKeys.length === 0) {
      toast.error("No keys selected for download.");
      return;
    }

    let envContent = "";
    selectedKeys.forEach((key) => {
      if (retrievedKeys[key]) {
        envContent += `${key}=${retrievedKeys[key]}\n`;
      }
    });

    const blob = new Blob([envContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "env_variables.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { position: "top-right" });
  };

  // Inside your TableData component
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // In the onClick for the "Edit" button, update the state with the key of the item being edited
  const handleEditClick = (key: string) => {
    setEditingKey(key);
    openEditModal();
  };

  return (
    <div className="relative">
      <Toaster />
      <div className="mt-4 mb-4">
        <button
          onClick={downloadEnvFile}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-500 transition"
        >
          <FaDownload className="inline mr-1" />
          Download Selected Keys
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-700">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="border border-gray-700 p-2 flex items-center justify-center flex-col">
              <span> Select all</span>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
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
                <td className="border border-gray-700 p-2">
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(envVar.key)}
                    onChange={() => toggleSelectKey(envVar.key)}
                  />
                </td>
                <td className="border border-gray-700 p-2">{envVar.key}</td>
                <td className="border border-gray-700 p-2">
                  {convertDateTime(envVar.createdAt)}
                </td>
                <td className="border border-gray-700 p-2 flex items-center justify-center gap-2 relative">
                  {!retrievedKeys[envVar.key] && (
                    <button
                      onClick={() => retrieveKey(envVar.key)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      <FaEye className="inline mr-1" /> Retrieve
                    </button>
                  )}

                  {retrievedKeys[envVar.key] && (
                    <button
                      onClick={() => handleEditClick(envVar.key)} // Pass the key to the handler
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      <FaPencilAlt className="inline mr-1" />
                      Edit
                    </button>
                  )}

                  {isEditModalOpen &&
                    editingKey === envVar.key &&
                    retrievedKeys[envVar.key] && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
                        >
                          <h2 className="text-xl mb-2">
                            Edit a Key {retrievedKeys[envVar.key]}
                          </h2>
                          <EditKeyForm
                            token={token}
                            refetch={refetch}
                            k={envVar.key} // Pass the key here
                            v={retrievedKeys[envVar.key]} // Pass the value here
                          />
                          <button
                            onClick={() => openEditModal()}
                            className="mt-2 text-white hover:text-white bg-red-500 px-8 py-2"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      </div>
                    )}
                  {/* {retrievedKeys[envVar.key] && (
                    <button
                      onClick={() => openEditModal()}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      <FaPencilAlt className="inline mr-1" />
                      Edit
                    </button>
                  )}

                  {isEditModalOpen && retrievedKeys[envVar.key] && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
                      >
                        <h2 className="text-xl mb-2">
                          Edit a Key {retrievedKeys[envVar.key]}
                        </h2>
                        <EditKeyForm
                          token={token}
                          refetch={refetch}
                          k={envVar.key}
                          v={retrievedKeys[envVar.key]}
                        />
                        <button
                          onClick={() => openEditModal()}
                          className="mt-2 text-white hover:text-white bg-red-500 px-8 py-2"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    </div>
                  )} */}

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
                    onClick={() => {
                      shareKey(envVar.key);
                      setShareModalKey(envVar.key);
                    }}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                  >
                    <FaShareAlt className="inline mr-1" /> Share
                  </button>

                  {shareModalKey === envVar.key &&
                    shareableLinks[envVar.key] && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gray-800 p-6 rounded-lg w-full max-w-sm"
                        >
                          <h2 className="text-xl mb-4">Share Key</h2>
                          <a
                            href={`https://api.whatsapp.com/send?text=Here is the env key: ${
                              shareableLinks[envVar.key]
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-400 hover:text-green-500 mb-2"
                          >
                            <FaWhatsapp /> Share via WhatsApp
                          </a>
                          <a
                            href={`mailto:?subject=Secure Key Link&body=Here is the env key: ${
                              shareableLinks[envVar.key]
                            }`}
                            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-500 mb-2"
                          >
                            <FaEnvelope /> Share via Email
                          </a>
                          <button
                            onClick={() =>
                              handleCopy(shareableLinks[envVar.key])
                            }
                            className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full mb-2"
                          >
                            <FaCopy /> Copy Link
                          </button>
                          <button
                            onClick={() => setShareModalKey(null)}
                            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded w-full"
                          >
                            Close
                          </button>
                        </motion.div>
                      </div>
                    )}
                  <button
                    onClick={() => handleDeleteKey(envVar.key)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    <FaTrash className="inline mr-1" />
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-400">
                No keys found, create one.
              </td>
            </tr>
          )}
        </tbody>

        {/* <thead>
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
                <td className="border border-gray-700 p-2 flex items-center justify-center gap-2 relative">
                  {!retrievedKeys[envVar.key] && (
                    <button
                      onClick={() => retrieveKey(envVar.key)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    >
                      <FaEye className="inline mr-1" /> Retrieve
                    </button>
                  )}
                  {retrievedKeys[envVar.key] && (
                    <button
                      onClick={() => openEditModal()}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                    >
                      <FaPencilAlt className="inline mr-1" />
                      Edit
                    </button>
                  )}
                  
                  {isEditModalOpen && retrievedKeys[envVar.key] && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gray-800 p-6 rounded-lg w-full max-w-md"
                      >
                        <h2 className="text-xl mb-2">
                          Edit a Key {retrievedKeys[envVar.key]}
                        </h2>
                        <EditKeyForm
                          token={token}
                          refetch={refetch}
                          k={envVar.key}
                          v={retrievedKeys[envVar.key]}
                        />
                        <button
                          onClick={() => openEditModal()}
                          className="mt-2 text-white hover:text-white bg-red-500 px-8 py-2"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    </div>
                  )}

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
                    onClick={() => {
                      shareKey(envVar.key);
                      setShareModalKey(envVar.key);
                    }}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                  >
                    <FaShareAlt className="inline mr-1" /> Share
                  </button>
                 
                  {shareModalKey === envVar.key &&
                    shareableLinks[envVar.key] && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gray-800 p-6 rounded-lg w-full max-w-sm"
                        >
                          <h2 className="text-xl mb-4">Share Key</h2>
                          <a
                            href={`https://api.whatsapp.com/send?text=Here is the env key: ${
                              shareableLinks[envVar.key]
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-400 hover:text-green-500 mb-2"
                          >
                            <FaWhatsapp /> Share via WhatsApp
                          </a>
                          <a
                            href={`mailto:?subject=Secure Key Link&body=Here is the env key: ${
                              shareableLinks[envVar.key]
                            }`}
                            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-500 mb-2"
                          >
                            <FaEnvelope /> Share via Email
                          </a>
                          <button
                            onClick={() =>
                              handleCopy(shareableLinks[envVar.key])
                            }
                            className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full mb-2"
                          >
                            <FaCopy /> Copy Link
                          </button>
                          <button
                            onClick={() => setShareModalKey(null)}
                            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded w-full"
                          >
                            Close
                          </button>
                        </motion.div>
                      </div>
                    )}
                  <button
                    onClick={() => handleDeleteKey(envVar.key)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    <FaTrash className="inline mr-1" />
                    Delete
                  </button>
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
        </tbody> */}
      </table>
    </div>
  );
}

export default TableData;
