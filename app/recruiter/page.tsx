"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RecruiterDashboard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [minCgpa, setMinCgpa] = useState("");

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("jobs")
      .insert([
        {
          title,
          company,
          description,
          min_cgpa: parseFloat(minCgpa),
          status: "pending" // Automatically requires admin approval
        }
      ]);

    if (error) {
      alert("Error posting job: " + error.message);
    } else {
      alert("Job posted successfully! Waiting for Admin approval.");
      setTitle("");
      setCompany("");
      setDescription("");
      setMinCgpa("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-black text-white">
      <div className="w-full max-w-2xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="p-6 bg-gray-800 rounded border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Post a New Job</h2>
          
          <form onSubmit={handlePostJob} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Job Title (e.g., Data Analyst)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="p-3 bg-gray-900 border border-gray-700 rounded text-white"
            />
            <input
              type="text"
              placeholder="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="p-3 bg-gray-900 border border-gray-700 rounded text-white"
            />
            <textarea
              placeholder="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="p-3 bg-gray-900 border border-gray-700 rounded text-white h-32"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Minimum CGPA Required (e.g., 7.0)"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value)}
              required
              className="p-3 bg-gray-900 border border-gray-700 rounded text-white"
            />
            <button 
              type="submit"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded transition-colors"
            >
              Submit for Approval
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}