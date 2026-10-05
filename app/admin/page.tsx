"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    // Fetch only jobs that need approval
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending");
    
    if (data) setPendingJobs(data);
  };

  const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);

    if (error) {
      alert("Error updating job: " + error.message);
    } else {
      // Remove the job from the screen once approved/rejected
      setPendingJobs(pendingJobs.filter(job => job.id !== jobId));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-black text-white">
      <div className="w-full max-w-4xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400">Admin Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Pending Job Approvals</h2>
        
        {pendingJobs.length === 0 ? (
          <p className="text-gray-400 bg-gray-800 p-4 rounded border border-gray-700">No pending jobs to review.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingJobs.map((job) => (
              <div key={job.id} className="p-5 border border-gray-700 rounded bg-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-xl text-blue-400">{job.title}</h3>
                  <p className="text-sm font-semibold text-gray-300">{job.company}</p>
                  <p className="text-sm text-gray-400 mt-2">{job.description}</p>
                  <p className="text-xs font-bold text-yellow-500 mt-2">Required CGPA: {job.min_cgpa}</p>
                </div>
                
                <div className="flex flex-col gap-2 ml-4 min-w-[100px]">
                  <button 
                    onClick={() => handleUpdateJobStatus(job.id, 'approved')} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateJobStatus(job.id, 'rejected')} 
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}