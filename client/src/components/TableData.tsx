import { Menu } from "@headlessui/react";
import {
  FaCopy,
  FaEye,
  FaShareAlt,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa";
import { convertDateTime } from "../../hooks/useDateTime";
import toast, { Toaster } from "react-hot-toast";

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
}

function TableData({
  data,
  retrievedKeys,
  retrieveKey,
  copyToClipboard,
  copiedKey,
  shareableLinks,
  shareKey,
}: TableDataProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { position: "top-right" });
  };

  return (
    <div className="relative">
      <Toaster />
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
                      onClick={() => copyToClipboard(envVar.key)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
                    >
                      <FaCopy className="inline mr-1" />
                      {copiedKey === envVar.key ? "Copied!" : "Copy"}
                    </button>
                  )}

                  {/* Share Button with Menu */}
                  <Menu as="div" className="relative">
                    <Menu.Button
                      onClick={() => shareKey(envVar.key)}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
                    >
                      <FaShareAlt className="inline mr-1" /> Share
                    </Menu.Button>

                    {shareableLinks[envVar.key] && (
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded shadow-md p-2 text-sm z-50">
                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={`https://api.whatsapp.com/send?text=Here is the env key: ${
                                shareableLinks[envVar.key]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-2 py-2 rounded ${
                                active
                                  ? "bg-gray-800 text-green-400"
                                  : "text-white"
                              }`}
                            >
                              <FaWhatsapp /> WhatsApp
                            </a>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <a
                              href={`mailto:?subject=Secure Key Link&body=Here is the env key: ${
                                shareableLinks[envVar.key]
                              }`}
                              className={`flex items-center gap-2 px-2 py-2 rounded ${
                                active
                                  ? "bg-gray-800 text-yellow-400"
                                  : "text-white"
                              }`}
                            >
                              <FaEnvelope /> Email
                            </a>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() =>
                                handleCopy(shareableLinks[envVar.key])
                              }
                              className={`flex items-center gap-2 w-full text-left px-2 py-2 rounded ${
                                active ? "bg-gray-800 text-white" : "text-white"
                              }`}
                            >
                              <FaCopy /> Copy Link
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    )}
                  </Menu>
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
  );
}

export default TableData;
