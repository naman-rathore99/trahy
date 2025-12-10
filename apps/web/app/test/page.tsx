"use client";
import { useState } from "react";

export default function TestPage() {
  const [status, setStatus] = useState("Waiting to test...");
  const [apiResponse, setApiResponse] = useState("");

  const testConnection = async () => {
    try {
      setStatus("Pinging Backend...");

      // 1. We try to talk to port 5000 (where your backend lives)
      // Note: If you deploy later, this URL will change.
      const response = await fetch("http://localhost:5000/");

      if (!response.ok) {
        throw new Error(`Server found but returned error: ${response.status}`);
      }

      const data = await response.json();

      // 2. Success!
      setStatus("✅ SUCCESS! Connected.");
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error(error);
      // 3. Failed
      setStatus("❌ FAILED. Is the backend running?");
      setApiResponse(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          System Link Check
        </h1>

        <div className="mb-6 p-4 bg-gray-50 rounded border text-center">
          <p className="text-sm text-gray-500 mb-1">Status:</p>
          <p className="font-bold text-lg">{status}</p>
        </div>

        <button
          onClick={testConnection}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Ping Backend Server
        </button>

        {apiResponse && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">Backend Response:</p>
            <pre className="bg-black text-green-400 p-4 rounded text-xs overflow-auto">
              {apiResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
