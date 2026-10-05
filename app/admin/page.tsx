"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPlatformData();
  }, []);

  const fetchAllPlatformData = async () => {
    const { data } = await supabase.from("jobs").select("*");
    if (data) setJobs(data);
  };

  const handleJobStatus = async (jobId: string, status: string) => {
    try {
      setLoadingAction(jobId);
      const { error } = await supabase
        .from("jobs")
        .update({ status })
        .eq("id", jobId);

      if (error) throw error;
      alert(`Job status successfully updated to: ${status.toUpperCase()}`);
      fetchAllPlatformData();
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
      alert("Listing removed from platform.");
      fetchAllPlatformData();
    } catch (err: any) {
      alert("Error deleting job: " + err.message);
    }
  };

  const approvedCount = jobs.filter((j) => j.status === "approved").length;
  const pendingCount = jobs.filter((j) => j.status === "pending" || !j.status).length;
  const rejectedCount = jobs.filter((j) => j.status === "rejected").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            Admin Governance Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform moderation, institutional compliance, and drive approvals.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">University Superuser Active</span>
        </div>
      </div>

      {/* Analytics & System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Total Listings</p>
          <p className="text-3xl font-black text-purple-400 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Approved Openings</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{approvedCount}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Pending Review</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Rejected / Flagged</p>
          <p className="text-3xl font-black text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Moderation Panel */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-4 text-pink-300 flex items-center gap-2">
          <span>🛡️</span> Campus Drive Moderation Queue
        </h2>
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No job openings currently registered in the database.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white text-lg">{job.title}</h3>
                    <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-md font-medium">
                      {job.company || "Corporate Partner"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Minimum CGPA Cutoff: <strong className="text-slate-200">{job.min_cgpa}</strong> • Recruiter ID: <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{job.recruiter_id ? job.recruiter_id.slice(0, 8) + '...' : 'System'}</code>
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1">{job.description}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                    job.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    job.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {job.status || 'pending'}
                  </span>

                  <div className="flex items-center gap-2">
                    {job.status !== 'approved' && (
                      <button
                        onClick={() => handleJobStatus(job.id, 'approved')}
                        disabled={loadingAction === job.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
                      >
                        Approve ✓
                      </button>
                    )}
                    {job.status !== 'rejected' && (
                      <button
                        onClick={() => handleJobStatus(job.id, 'rejected')}
                        disabled={loadingAction === job.id}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
                      >
                        Reject ✕
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}