'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<any>(null); // This will now hold the full patient object
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Pointing to the endpoint that returns full history
      const response = await axios.get(`http://localhost:3000/patient/${phone}`);
      setData(response.data);
    } catch (err) {
      alert("Patient not found.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Patient Records: {data?.name}</h1>
      
      {/* Search Bar remains the same */}
      <input className="border p-2" onChange={(e) => setPhone(e.target.value)} />
      <button className="bg-blue-600 text-white p-2" onClick={fetchStatus}>Search</button>

      {data && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Report History</h2>
          <div className="space-y-4">
            {data.labReports.map((report: any) => (
              <div key={report.id} className={`p-4 rounded border ${report.requiresAttention ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="font-bold">Date: {new Date(report.uploadedAt).toLocaleDateString()}</p>
                <p>Status: {report.requiresAttention ? "⚠️ Attention Needed" : "✅ Normal"}</p>
                {report.anomalies.length > 0 && (
                  <p className="text-sm">Issues: {report.anomalies.join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}