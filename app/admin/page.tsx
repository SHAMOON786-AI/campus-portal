"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  useEffect(() => {
    fetchAllPlatformData();
  }, []);

  const fetchAllPlatformData = async () => {
    const { data: jobData } = await supabase.from("jobs").select("*");
    if (jobData) setJobs(jobData);

    const { data: appData } = await supabase.from("applications").select("*, jobs(*)");
    if (appData) setApplications(appData);
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
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status });
      }
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
      setSelectedJob(null);
      fetchAllPlatformData();
    } catch (err: any) {
      alert("Error deleting job: " + err.message);
    }
  };

  const approvedCount = jobs.filter((j) => j.status === "approved").length;
  const pendingCount = jobs.filter((j) => j.status === "pending" || !j.status).length;
  const rejectedCount = jobs.filter((j) => j.status === "rejected").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto relative">
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

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                    job.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    job.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {job.status || 'pending'}
                  </span>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                  >
                    📋 View Details
                  </button>

                  <div className="flex items-center gap-2">
                    {job.status !== 'approved' && (
                      <button
                        onClick={() => handleJobStatus(job.id, 'approved')}
                        disabled={loadingAction === job.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
                      >
                        Approve ✓
                      </button>
                    )}
                    {job.status !== 'rejected' && (
                      <button
                        onClick={() => handleJobStatus(job.id, 'rejected')}
                        disabled={loadingAction === job.id}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
                      >
                        Reject ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🏢</span>
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedJob.title}</h3>
                <p className="text-indigo-400 font-semibold">{selectedJob.company || "Corporate Partner"}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-xs">Drive Description & Requirements:</span>
                <p className="mt-1 text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Minimum CGPA Cutoff:</span>
                  <p className="font-bold text-emerald-400 text-lg mt-0.5">{selectedJob.min_cgpa}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-semibold">Current Moderation Status:</span>
                  <p className="font-bold uppercase text-purple-400 text-lg mt-0.5">{selectedJob.status || 'pending'}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-xs uppercase font-semibold">Recruiter Identifier:</span>
                <p className="font-mono text-xs text-slate-400 bg-slate-900 p-2 rounded mt-1 break-all">{selectedJob.recruiter_id || 'System Generated'}</p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-sm text-pink-300 mb-2">
                Applicants for this Drive ({applications.filter(a => a.job_id === selectedJob.id).length}):
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {applications.filter(a => a.job_id === selectedJob.id).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No candidates have applied to this specific opening yet.</p>
                ) : (
                  applications.filter(a => a.job_id === selectedJob.id).map(app => (
                    <div key={app.id} className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-300 font-mono">Candidate ID: {app.student_id.slice(0, 10)}...</span>
                        {app.resume_url && (
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline ml-2 font-medium">
                            📄 Resume
                          </a>
                        )}
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleDeleteJob(selectedJob.id)}
                className="bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Delete Listing 🗑️
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}