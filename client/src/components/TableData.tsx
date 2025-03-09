import {
  FaCopy,
  FaEye,
  FaShareAlt,
  FaWhatsapp,
  FaEnvelope,
  FaPencilAlt,
  FaTrash,
  FaDownload,
  FaSpinner,
  FaPlusCircle,
  FaUpload,
  FaFile,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { convertDateTime } from "../../hooks/useDateTime";
import toast, { Toaster } from "react-hot-toast";
import EditKeyForm from "./EditKeyForm";
import { useState } from "react";
import { HyperText } from "./magicui/hyper-text";

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
  handleDeleteKey: (id:string,key: string) => void;
  isEditModalOpen: boolean;
  openEditModal: () => void;
  refetch: () => void;
  token: string | null;
  isLoadingKeys: boolean;
  setIsModalOpen: (value: boolean) => void;
  setIstEditModalOpen: (value: boolean) => void;
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
  isLoadingKeys,
  setIsModalOpen,
  setIstEditModalOpen
}: TableDataProps) {
  const [shareModalKey, setShareModalKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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
      // else {
      //   toast.error(
      //     "First retrieve keys or a key to download.,No keys found for download."
      //   );
      //   return;
      // }
    });
    if (envContent === "") {
      toast.error("First retrieve keys or a key then select to download");

      return;
    }
    const blob = new Blob([envContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "env_variables.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Downloaded env file successfully!", {
      position: "top-right",
    });
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
  const uploadEnvFile = async (file: File) => {
    if (!file) {
      toast.error("No file selected. Choose file to upload.");
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        throw new Error("File is empty or unreadable.");
      }

      const envVariables = parseEnvFile(text);
      console.log("Parsed Env Variables:", envVariables);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/store/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ Variables: envVariables }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Server Response:", data);
      toast.success("Keys saved successfully!");
      refetch();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Upload failed: ${error}`);
    }finally{
      setFile(null);
    }
  };


  const parseEnvFile = (text: string) => {
    const envVars: Record<string, string> = {};
  
    text.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
  
      // Ignore empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }
  
      // Split only at the first "=" to avoid issues with values containing "="
      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex === -1) {
        return; // Ignore invalid lines without "="
      }
  
      const key = trimmedLine.substring(0, separatorIndex).trim();
      const value = trimmedLine.substring(separatorIndex + 1).trim();
  
      if(!key && !value){
        toast.error("Invalid key value pair in the env");
        return;
      } 
      if (key) {
        envVars[key] = value;
      }
    });
  
    console.log("Parsed Env Variables:", envVars);
    return envVars;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="relative">
      <Toaster />
      <div className="mt-4 mb-4 flex flex-col-reverse gap-6 sm:gap-0 sm:grid  grid-cols-1 sm:grid-cols-2   p-2  w-full  max-w-4xl h-full sm:items-end ">
        <button
          onClick={downloadEnvFile}
          className="bg-green-500 text-white px-4 py-2 rounded transition hover:bg-green-600 w-[100%] sm:w-[250px] h-[50px]"
        >
          <FaDownload className="inline mr-1" />
          Download Selected Keys
        </button>

        <div className="flex w-full  gap-4 items-end ">
          {/* Button to Open Modal */}

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 py-2 px-4 rounded hover:bg-blue-600 transition  w-[80%] sm:w-[250px] h-[50px]"
          >
            <FaPlusCircle className="inline mr-1" />
            New Key
          </button>
          <div className="rounded-xl gap-2 w-[80%] sm:w-[250px] flex flex-col justify-end items-end pt-2 px-2 bg-slate-600">
            <p>Upload key/s from a file(.txt,.env,.env.*)</p>
            <div className="flex flex-col items-center gap-2 w-full">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-between w-full h-[50px] border-2 border-gray-300 rounded-xl px-4 cursor-pointer bg-white hover:bg-gray-100 transition"
              >
                <span className={`text-gray-600 w-full truncate ${!file && "text-gray-400"}`} >
                  <FaFile className="inline mr-1" />
                  {file ? file.name : "Choose file"}
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".txt,.env,.env.*"
                onChange={handleFileChange}
                className={`hidden ${!file && "bg-gray-500"}`}
              />
            </div>
            <button
              onClick={() => file && uploadEnvFile(file)}
              // disabled={!file}
              className={`w-full  mb-2 px-4 py-2 bg-blue-500 text-white rounded mt-2 ${
                !file && "bg-gray-500"}`}
            >
              <FaUpload className="inline mr-1" />
              Upload
            </button>
          </div>
        </div>
      </div>
      <h2 className="text-xl mb-2">Stored Variables</h2>

      <table className="w-full border-collapse border border-gray-700 ">
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
          {isLoadingKeys && (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Loading keys...
                </div>
              </td>
            </tr>
          )}
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
                <td className="border border-gray-700 p-2">
                <p className="text-base">  {envVar.key}</p>
                 
                </td>
                <td className="border border-gray-700 p-2">
                <HyperText className="text-base font-medium">
                  {convertDateTime(envVar.createdAt)}
                  </HyperText>
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
                          <h2 className="text-xl mb-2">Edit a Key</h2>
                          <EditKeyForm
                        setIstEditModalOpen={setIstEditModalOpen}
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
                    onClick={() => handleDeleteKey(envVar._id, envVar.key)}
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
      </table>
    </div>
  );
}

export default TableData;
