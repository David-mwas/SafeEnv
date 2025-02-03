import React from "react";

interface StroreKeysFormProps {
  handleStore: (event: React.FormEvent<HTMLFormElement>) => void;
  setKey: (value: string) => void;
  setValue: (value: string) => void;
  envkey: string;
  value: string;
}

function StroreKeysForm({
  handleStore,
  setKey,
  setValue,
  envkey,
  value,
}: StroreKeysFormProps) {
  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleStore} className="space-y-4 ">
        <input
          required
          value={envkey}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key"
          className="w-full p-2 text-white rounded placeholder:text-white border bg-gray-700"
        />
        <input
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
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
