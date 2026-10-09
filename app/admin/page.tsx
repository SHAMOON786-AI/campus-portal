"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { logAdminAction } from "../actions";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", profile_picture_url: "" });

  useEffect(() => {
    fetchAllPlatformData();
  }, []);

  const fetchAllPlatformData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = '/login'; return; }
    const { data: jobData } = await supabase.from("jobs").select("*");
    if (jobData) setJobs(jobData);

    const { data: compData } = await supabase.from("company_profiles").select("*");
    if (compData) setCompanies(compData);

    const { data: logData } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50);
    if (logData) setAuditLogs(logData);

    // Fetch Admin Profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profile) {
      setAdminProfile(profile);
      setProfileForm({ name: profile.name || "", profile_picture_url: profile.profile_picture_url || "" });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      id: user.id,
      role: adminProfile?.role || "admin",
      email: user.email,
      name: profileForm.name,
      profile_picture_url: profileForm.profile_picture_url,
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      setIsEditingProfile(false);
      fetchAllPlatformData();
    }
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

  const handleViewJob = async (job: any) => {
    setSelectedJob(job);
    setLoadingApplications(true);
    setJobApplications([]);
    try {
      const { data: apps, error } = await supabase
        .from("applications")
        .select("*, profiles(*)")
        .eq("job_id", job.id);
      if (error) throw error;
      if (apps) setJobApplications(apps);
    } catch (err: any) {
      console.error("Error fetching applications:", err.message);
    } finally {
      setLoadingApplications(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-slate-950">`n      {/* Background Image */}`n      <div className="absolute inset-0 z-0 opacity-[0.15] bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')" }} />
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none mix-blend-screen">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-purple-600/20 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-rose-600/10 blur-[120px]"></div>
      </div>
      
      <div className="p-8 max-w-6xl mx-auto space-y-10 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {adminProfile?.profile_picture_url ? (
            <img src={adminProfile.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenImage(adminProfile.profile_picture_url)} />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500 border-2 border-slate-700 shadow-lg">
              {adminProfile?.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Vellore_Institute_of_Technology_seal_2017.svg/120px-Vellore_Institute_of_Technology_seal_2017.svg.png" alt="VIT Logo" className="h-10 bg-white p-1 rounded shadow-sm" />
              <span className="text-white font-bold tracking-widest text-sm opacity-80 uppercase">VIT Vellore</span>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Admin Governance Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">Platform moderation, institutional compliance, and drive approvals.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-full transition-all text-sm border border-slate-700">
            {isEditingProfile ? "Cancel Edit" : "Edit Profile"}
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} className="border border-red-900/50 hover:bg-red-900/30 text-red-400 font-bold py-2 px-6 rounded-full transition-all text-sm flex items-center gap-2">
            Sign Out 🚪
          </button>
        </div>
      </div>

      {isEditingProfile && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
              <input type="text" placeholder="Admin Name" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm w-full" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Profile Picture</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setProfileForm({...profileForm, profile_picture_url: reader.result as string});
                    reader.readAsDataURL(file);
                  }
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-sm w-full file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600/20 file:text-purple-400 hover:file:bg-purple-600/30" 
              />
            </div>
            <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md h-[42px]">Save</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Company Profiles List */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4 text-purple-300 flex items-center gap-2"><span>🏢</span> Registered Companies</h2>
          {companies.length === 0 ? <p className="text-slate-400 text-sm italic py-4">No companies registered.</p> : (
            <div className="space-y-4">
              {companies.map(comp => (
                <div key={comp.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2">
                  <div className="flex items-start gap-4">
                    {comp.logo_url ? (
                      <img 
                        src={comp.logo_url} 
                        alt="Logo" 
                        className="w-12 h-12 object-contain rounded border border-slate-700 bg-slate-900 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setFullScreenImage(comp.logo_url)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500 border border-slate-700 shrink-0">
                        🏢
                      </div>
                    )}
                    <div className="flex-1">
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
                    <button onClick={() => handleViewJob(job)} className="bg-blue-600/40 hover:bg-blue-600 text-blue-300 border border-blue-800 text-xs font-bold px-3 py-2 rounded-xl">View Details</button>
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

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center font-bold z-10">&times;</button>
            <div className="p-8 space-y-8">
              {/* Job Info */}
              <div>
                <h2 className="text-3xl font-black text-white">{selectedJob.title}</h2>
                <h3 className="text-xl text-blue-400 font-bold mb-4">{selectedJob.company}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div><span className="block text-xs text-slate-500 uppercase font-bold">Location</span><span className="text-sm text-slate-300">{selectedJob.location || "Not specified"}</span></div>
                  <div><span className="block text-xs text-slate-500 uppercase font-bold">Min CGPA</span><span className="text-sm text-slate-300">{selectedJob.min_cgpa}</span></div>
                  <div><span className="block text-xs text-slate-500 uppercase font-bold">Departments</span><span className="text-sm text-slate-300">{selectedJob.allowed_departments?.join(', ') || 'All Departments'}</span></div>
                  <div><span className="block text-xs text-slate-500 uppercase font-bold">Status</span><span className="text-sm font-bold uppercase text-emerald-400">{selectedJob.status}</span></div>
                </div>
                
                <div className="mt-4">
                  <span className="block text-xs text-slate-500 uppercase font-bold mb-2">Job Description</span>
                  <p className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              </div>

              {/* Applications & Candidate Offers */}
              <div>
                <h3 className="text-xl font-bold text-emerald-300 mb-4 border-b border-slate-800 pb-2">Candidate Pipeline & Offers</h3>
                {loadingApplications ? (
                  <p className="text-slate-400 italic text-sm">Loading applications...</p>
                ) : jobApplications.length === 0 ? (
                  <p className="text-slate-400 italic text-sm">No applications for this drive yet.</p>
                ) : (
                  <div className="space-y-4">
                    {jobApplications.map((app: any) => (
                      <div key={app.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 shrink-0">
                            {app.profiles?.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{app.profiles?.name || "Student"}</p>
                            <p className="text-xs text-slate-400">CGPA: {app.profiles?.cgpa} | Branch: {app.profiles?.branch}</p>
                            <p className="text-xs font-bold mt-1 uppercase">
                              Status: <span className={
                                app.status === 'hired' ? 'text-emerald-400' :
                                app.status === 'interview' ? 'text-blue-400' :
                                app.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                              }>{app.status}</span>
                            </p>
                          </div>
                        </div>

                        {/* Interview / Offer Details for Admin */}
                        {(app.status === 'interview' || app.status === 'hired' || app.interview_date || app.offered_package) && (
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 min-w-[250px] text-xs space-y-1">
                            {app.interview_date && (
                              <p className="text-slate-300"><strong className="text-blue-400">Interview:</strong> {new Date(app.interview_date).toLocaleString()}</p>
                            )}
                            {app.offered_package && (
                              <div className="border-t border-slate-700/50 mt-1 pt-1">
                                <p className="text-slate-300"><strong className="text-emerald-400">Offer Package:</strong> {app.offered_package}</p>
                                {app.joining_date && <p className="text-slate-300"><strong className="text-slate-400">Joining:</strong> {app.joining_date}</p>}
                                {app.reporting_place && <p className="text-slate-300"><strong className="text-slate-400">Location:</strong> {app.reporting_place}</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full w-12 h-12 flex items-center justify-center font-bold text-2xl transition-all">&times;</button>
          <img 
            src={fullScreenImage} 
            alt="Full Screen Profile" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </div>
    </div>
  );
}
