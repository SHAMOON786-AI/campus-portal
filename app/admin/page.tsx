"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending"); 
      
    if (data) setPendingJobs(data);
  };

  const handleApprove = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "approved" })
      .eq("id", jobId);
      
    if (!error) {
      alert("Job Approved!");
      fetchPendingJobs(); 
    }
  };

  const handleReject = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "rejected" })
      .eq("id", jobId);
      
    if (!error) {
      alert("Job Rejected!");
      fetchPendingJobs(); 
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-black text-white">
      <div className="w-full max-w-4xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="p-6 bg-gray-800 rounded border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Pending Job Approvals</h2>
          
          {pendingJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No pending jobs to review.</p>
          ) : (
            pendingJobs.map((job) => (
              <div key={job.id} className="mb-4 p-4 border border-gray-600 rounded bg-gray-700">
                <h3 className="text-lg font-bold text-blue-400">{job.title}</h3>
                <p className="font-semibold">{job.company}</p>
                <p className="text-sm text-gray-300 mt-2">{job.description}</p>
                <p className="text-xs text-yellow-400 mt-2 mb-4">Min CGPA: {job.min_cgpa}</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleApprove(job.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(job.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}