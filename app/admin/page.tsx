"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { logAdminAction } from "../actions";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchAllPlatformData();
  }, []);

  const fetchAllPlatformData = async () => {
    const { data: jobData } = await supabase.from("jobs").select("*");
    if (jobData) setJobs(jobData);

    const { data: compData } = await supabase.from("company_profiles").select("*");
    if (compData) setCompanies(compData);

    const { data: logData } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (logData) setAuditLogs(logData);
  };

  const handleJobStatus = async (jobId: string, status: string) => {
    try {
      setLoadingAction(jobId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Unauthorized");

      const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
      if (error) throw error;
      
      await logAdminAction(user.id, `job_${status}`, "job", jobId, { new_status: status });

      alert(`Job status updated to: ${status.toUpperCase()}`);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
      
      await logAdminAction(user.id, "job_deleted", "job", jobId, {});
      
      alert("Listing removed from platform.");
      fetchAllPlatformData();
    } catch (err: any) {
      alert("Error deleting job: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
            Admin Governance Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform moderation, institutional compliance, and drive approvals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Company Profiles List */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-300 flex items-center gap-2"><span>🏢</span> Registered Companies</h2>
          {companies.length === 0 ? <p className="text-slate-400 text-sm italic py-4">No companies registered.</p> : (
            <div className="space-y-4">
              {companies.map(comp => (
                <div key={comp.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{comp.company_name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3">{comp.description}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                     <span className="text-xs text-slate-500">Recruiter ID: {comp.recruiter_id?.substring(0,8)}</span>
                     <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Job Approvals */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4 text-pink-300 flex items-center gap-2"><span>🛡️</span> Campus Drive Moderation</h2>
          {jobs.length === 0 ? <p className="text-slate-400 text-sm italic py-4">No jobs registered.</p> : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {jobs.map(job => (
                <div key={job.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{job.title}</h3>
                      <p className="text-xs text-blue-400">{job.company}</p>
                      <p className="text-xs text-slate-400 mt-1">Min CGPA: {job.min_cgpa} • Depts: {job.allowed_departments?.join(', ') || 'Any'}</p>
                    </div>
                    <span className="text-xs bg-slate-900 px-3 py-1.5 rounded-lg border font-bold uppercase">{job.status || 'pending'}</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-900">
                    <button onClick={() => handleJobStatus(job.id, 'approved')} disabled={loadingAction === job.id || job.status === 'approved'} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50">Approve</button>
                    <button onClick={() => handleJobStatus(job.id, 'rejected')} disabled={loadingAction === job.id || job.status === 'rejected'} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50">Reject</button>
                    <button onClick={() => handleDeleteJob(job.id)} className="bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold px-3 py-2 rounded-xl ml-auto">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-300 flex items-center gap-2"><span>📜</span> Administrative Action Logs</h2>
        {auditLogs.length === 0 ? <p className="text-slate-400 text-sm italic">No audit logs found.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Reviewer ID</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target Type</th>
                  <th className="p-3">Target ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-950/50">
                    <td className="p-3">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-mono">{log.reviewer_id.substring(0, 8)}...</td>
                    <td className="p-3 font-bold text-indigo-400 uppercase">{log.action}</td>
                    <td className="p-3 uppercase">{log.target_type}</td>
                    <td className="p-3 font-mono">{log.target_id.substring(0, 8)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
