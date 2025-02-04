import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface StroreKeysFormProps {
  v: string;
  k: string;
  token: string | null;
  refetch: () => void;
}

function StroreKeysForm({ k, v, token, refetch }: StroreKeysFormProps) {
  const [envkey, setKey] = useState("");
  const [value, setValue] = useState("");

  const mutation = useMutation({
    mutationFn: async (newVar: { NewKey: string; NewValue: string }) => {
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/keys/${k}`, newVar, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      refetch();
      toast.success("Key updated successfully");
    },
  });

  // Handle form submission
  const handleStore = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!envkey || !value) return;
    mutation.mutate({ NewKey: envkey, NewValue: value });
    setKey("");
    setValue("");
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={(e) => handleStore(e)} className="space-y-4 ">
        <input
          required
          value={envkey}
          onChange={(e) => setKey(e.target.value)}
          placeholder={k}
          className="w-full p-2 text-white rounded placeholder:text-white border bg-gray-700"
        />
        <input
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={v}
          className="w-full p-2 text-white rounded placeholder:text-white border bg-gray-700"
        />
        <button
          type="submit"
          className="w-full bg-green-600 py-2 rounded hover:bg-green-700 transition"
        >
          Store
        </button>
      </form>
    </div>
  );
}

export default StroreKeysForm;
