"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetchAllJobs();
  }, []);

  const fetchAllJobs = async () => {
    const { data } = await supabase.from("jobs").select("*");
    if (data) setJobs(data);
  };

  const handleJobStatus = async (jobId: string, status: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", jobId);

    if (error) {
      alert("Error updating job status: " + error.message);
    } else {
      alert(`Job status updated to ${status}!`);
      fetchAllJobs();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Admin Governance Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Moderate job postings and oversee platform compliance.</p>
        </div>
        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-4 py-2 rounded-full font-semibold">
          System Admin Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Total Platform Listings</p>
          <p className="text-4xl font-black text-purple-400 mt-2">{jobs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Approved Openings</p>
          <p className="text-4xl font-black text-emerald-400 mt-2">{jobs.filter(j => j.status === 'approved').length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Pending Approvals</p>
          <p className="text-4xl font-black text-amber-400 mt-2">{jobs.filter(j => j.status === 'pending' || !j.status).length}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-pink-300">🛡️ Job Moderation & Approvals</h2>
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No job listings found in the system database.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{job.title}</h3>
                  <p className="text-xs text-blue-400 font-medium">{job.company || "Company"} • Min CGPA: {job.min_cgpa}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{job.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-semibold ${
                    job.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {job.status || 'pending'}
                  </span>
                  {job.status !== 'approved' ? (
                    <button
                      onClick={() => handleJobStatus(job.id, 'approved')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                    >
                      Approve ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJobStatus(job.id, 'rejected')}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
                    >
                      Reject ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}