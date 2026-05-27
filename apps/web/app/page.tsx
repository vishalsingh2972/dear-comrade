'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Connecting to your running NestJS backend
      const response = await axios.get(`http://localhost:3000/patient/${phone}/latest-status`);
      setData(response.data);
    } catch (error) {
      console.error(error);
      alert("Could not fetch patient data. Make sure the backend is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Dear Comrade Dashboard</h1>
      
      <div className="flex gap-2">
        <input 
          className="border p-2 rounded w-64 text-black"
          placeholder="Enter Patient Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={fetchStatus}
        >
          {loading ? 'Searching...' : 'View Status'}
        </button>
      </div>

      {data && (
        <div className="mt-10 p-6 border rounded-xl shadow-lg w-full max-w-lg bg-white text-black">
          <h2 className="text-2xl font-bold mb-2">{data.patientName || "Patient Record"}</h2>
          <p className="text-gray-600 mb-4">Last Updated: {new Date(data.latestReportDate).toLocaleDateString()}</p>
          
          <div className={`p-4 rounded ${data.isHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="font-bold">{data.isHealthy ? "✅ Status: Healthy" : "⚠️ Status: Needs Attention"}</p>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">Doctor's Summary:</h3>
            <p className="italic text-gray-700">{data.summary}</p>
          </div>
        </div>
      )}
    </main>
  );
}