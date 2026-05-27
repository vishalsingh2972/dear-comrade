'use client';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('hi-IN');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/patient/${phone}`);
      setData(response.data);
    } catch (err) {
      alert("Patient not found.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (reportId: string) => {
    console.log("Button clicked for report:", reportId); // Check this in F12 console
    setLoading(true); // You can reuse your loading state
    try {
      const url = `http://localhost:3000/patient/${phone}/report/${reportId}/audio`;
      console.log("Calling URL:", url);

      const response = await axios.get(url, {
        params: { lang: language }
      });

      console.log("Response received:", response.data);
      setAudioUrl(response.data.audioUrl);
    } catch (err: any) {
      console.error("DEBUG ERROR:", err);
      alert(`Failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Patient Records: {data?.name}</h1>

      <input className="border p-2 mr-2" onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" />
      <button className="bg-blue-600 text-white p-2" onClick={fetchStatus}>Search</button>

      {/* Language Switcher */}
      <div className="mt-4">
        <label>Select Language: </label>
        <select onChange={(e) => setLanguage(e.target.value)} value={language} className="border p-2">
          <option value="hi-IN">Hindi</option>
          <option value="te-IN">Telugu</option>
        </select>
      </div>

      {data && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Report History</h2>
          {audioUrl && <audio src={audioUrl} autoPlay className="mb-4" controls />}

          <div className="space-y-4">
            {data.labReports.map((report: any) => (
              <div key={report.id} className={`p-4 rounded border ${report.requiresAttention ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <p className="font-bold">Date: {new Date(report.uploadedAt).toLocaleDateString()}</p>
                <p>Status: {report.requiresAttention ? "⚠️ Attention Needed" : "✅ Normal"}</p>
                <button
                  onClick={() => playAudio(report.id)}
                  className="mt-2 bg-purple-600 text-white p-1 px-3 rounded text-sm"
                >
                  🎧 Play Summary
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}