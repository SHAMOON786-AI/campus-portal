"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { supabase } from "../../lib/supabase";
import { submitApplication } from "../actions";

export default function StudentDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); const [selectedApp, setSelectedApp] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", branch: "", cgpa: "", graduation_year: "", resume_url: "", profile_picture_url: "" });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    // Fetch Profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profile) {
      setStudentProfile(profile);
      setProfileForm(profile);
    }

    // Fetch Applications
    const { data: appData } = await supabase.from("applications").select("*, jobs(*)").eq("student_id", user.id);
    if (appData) setApplications(appData);

    // Fetch Jobs
    const { data: jobData } = await supabase.from("jobs").select("*").eq("status", "approved");
    if (jobData) setJobs(jobData);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      id: user.id,
      role: studentProfile?.role || "student",
      email: user.email,
      name: profileForm.name,
      branch: profileForm.branch,
      cgpa: parseFloat(profileForm.cgpa),
      graduation_year: parseInt(profileForm.graduation_year),
      resume_url: profileForm.resume_url,
      profile_picture_url: profileForm.profile_picture_url,
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    setLoading(false);
    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      setIsEditingProfile(false);
      fetchStudentData();
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in.");
        return;
      }

      const result = await submitApplication(jobId, user.id);
      if (!result.success) {
        alert(result.error);
        return;
      }
      alert("Application submitted successfully!");
      fetchStudentData();
    } catch (err: any) {
      alert("Error applying: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-slate-950">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop')" }}
      />
      
      {/* Dynamic Background Glow Overlay */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none mix-blend-screen">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/20 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>
      
      <div className="p-8 max-w-6xl mx-auto space-y-10 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Student Dashboard Pro
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage Profile, Track Applications, Apply for Drives.</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} className="border border-red-900/50 hover:bg-red-900/30 text-red-400 font-bold py-2 px-6 rounded-full transition-all text-sm flex items-center gap-2">
          Sign Out 🚪
        </button>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2"><span>🎓</span> My Profile</h2>
          <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all">
            {isEditingProfile ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-4">
              {profileForm.profile_picture_url ? (
                <img src={profileForm.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-slate-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-500 border-2 border-slate-700">?</div>
              )}
              <div>
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
                  className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-sm w-full file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30" 
                />
              </div>
            </div>
            <input type="text" placeholder="Full Name" required value={profileForm.name || ""} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm" />
            <input type="text" placeholder="Branch / Department (e.g. CSE)" required value={profileForm.branch || ""} onChange={e => setProfileForm({...profileForm, branch: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm" />
            <input type="number" step="0.01" placeholder="CGPA" required value={profileForm.cgpa || ""} onChange={e => setProfileForm({...profileForm, cgpa: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm" />
            <input type="number" placeholder="Graduation Year" required value={profileForm.graduation_year || ""} onChange={e => setProfileForm({...profileForm, graduation_year: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm" />
            <input type="url" placeholder="Resume URL" required value={profileForm.resume_url || ""} onChange={e => setProfileForm({...profileForm, resume_url: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm md:col-span-2" />
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl md:col-span-2 shadow-md">Save Profile</button>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-sm text-slate-300">
            {studentProfile?.profile_picture_url ? (
              <img src={studentProfile.profile_picture_url} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-xl" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-500 border-4 border-slate-800 shadow-xl">
                {studentProfile?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div><span className="block text-slate-500 text-xs uppercase font-semibold">Full Name</span><strong className="text-white text-base">{studentProfile?.name || "N/A"}</strong></div>
              <div><span className="block text-slate-500 text-xs uppercase font-semibold">Branch</span><strong className="text-white text-base">{studentProfile?.branch || "N/A"}</strong></div>
              <div><span className="block text-slate-500 text-xs uppercase font-semibold">CGPA</span><strong className="text-white text-base">{studentProfile?.cgpa || "N/A"}</strong></div>
              <div><span className="block text-slate-500 text-xs uppercase font-semibold">Graduation Year</span><strong className="text-white text-base">{studentProfile?.graduation_year || "N/A"}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Available Drives */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400">🚀 Available Campus Drives</h2>
        {jobs.length === 0 ? <p className="text-slate-400 text-sm italic">No approved job openings available right now.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job, index) => (
              <Tilt key={job.id} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" scale={1.02} transitionSpeed={2000} tiltMaxAngleX={5} tiltMaxAngleY={5} className="h-full"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all h-full shadow-xl">
                <div>
                  <h3 className="font-bold text-white text-lg">{job.title}</h3>
                  <p className="text-xs text-blue-400 font-medium">{job.company}</p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{job.description}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-900 mt-2">
                  <span className="text-xs text-slate-400">Min CGPA: <strong className="text-slate-200">{job.min_cgpa || 'None'}</strong> | Depts: <strong className="text-slate-200">{job.allowed_departments?.length ? job.allowed_departments.join(', ') : 'Any'}</strong></span>
                  <button onClick={() => handleApply(job.id)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all">Quick Apply 🚀</button>
                </div>
              </motion.div></Tilt>
            ))}
          </div>
        )}
      </div>

      {/* Applications */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-6 text-indigo-300">⚡ Application Status</h2>
        {applications.length === 0 ? <p className="text-slate-400 text-sm italic">You have not applied to any campus openings yet.</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app, index) => (
              <Tilt key={app.id} glareEnable={true} glareMaxOpacity={0.15} glareColor="#ffffff" glarePosition="all" scale={1.02} transitionSpeed={2000} tiltMaxAngleX={5} tiltMaxAngleY={5} className="h-full"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: index * 0.1 }} onClick={() => setSelectedApp(app)} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-4 hover:border-blue-500 cursor-pointer transition-all shadow-lg hover:shadow-blue-500/20 h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{app.jobs?.title || "Position Removed"}</h3>
                    <p className="text-xs text-blue-400 mb-1">{app.jobs?.company}</p>
                    <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                      Applied: {new Date(app.applied_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                    {app.interview_date && app.status !== 'rejected' && (
                      <p className="text-[11px] text-blue-400 font-bold tracking-wide mt-1">
                        📅 Interview: {new Date(app.interview_date).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                      app.status === 'hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      app.status === 'shortlisted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      app.status === 'interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
                
                {app.interview_date && app.status !== 'hired' && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Interview Scheduled</p>
                    <p className="text-sm font-semibold text-amber-400 mt-1">
                      {new Date(app.interview_date).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                )}
                
                {app.offered_package && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Offer Details</p>
                    <p className="text-sm font-semibold text-emerald-400 mt-1">Package: {app.offered_package}</p>
                    {app.joining_date && <p className="text-xs text-slate-400 mt-1">Joining: {new Date(app.joining_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                  </div>
                )}
              </motion.div></Tilt>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setSelectedApp(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center font-bold">&times;</button>
            <div className="p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-3xl font-black text-white">{selectedApp.jobs?.title}</h2>
                <p className="text-blue-400 font-bold text-lg">{selectedApp.jobs?.company}</p>
                <p className="text-xs text-slate-500 mt-1">Applied on {new Date(selectedApp.applied_at).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                <div className="flex gap-2 mt-3">
                  <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">CGPA: {selectedApp.jobs?.min_cgpa}+</span>
                  {selectedApp.jobs?.location && <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded">📍 {selectedApp.jobs?.location}</span>}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Job Description</h3>
                <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{selectedApp.jobs?.description}</p>
              </div>

              {selectedApp.jobs?.allowed_departments && selectedApp.jobs.allowed_departments.length > 0 && (
                <div>
                  <h3 className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Eligible Branches</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.jobs.allowed_departments.map((d: string) => (
                      <span key={d} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded text-xs">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Details */}
              {selectedApp.interview_date && (
                <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl">
                  <h3 className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">📅 Interview Scheduled</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Date & Time</p>
                      <p className="text-white font-medium">{new Date(selectedApp.interview_date).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Offer Details */}
              {selectedApp.offered_package && (
                <div className="bg-emerald-900/20 border border-emerald-800 p-4 rounded-xl mt-4">
                  <h3 className="text-sm text-emerald-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">🎉 Offer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApp.offered_package && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Package</p>
                        <p className="text-white font-bold text-lg">{selectedApp.offered_package}</p>
                      </div>
                    )}
                    {selectedApp.joining_date && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Joining Date</p>
                        <p className="text-white font-medium">{new Date(selectedApp.joining_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    )}
                    {selectedApp.reporting_place && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Reporting Location</p>
                        <p className="text-white font-medium">{selectedApp.reporting_place}</p>
                      </div>
                    )}
                    {selectedApp.reporting_time && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase">Reporting Time</p>
                        <p className="text-white font-medium">{selectedApp.reporting_time}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedApp.offered_package && (
                <div className="bg-emerald-950/30 border border-emerald-900 rounded-xl p-5 mt-4">
                  <h3 className="text-emerald-400 font-bold mb-2">🎉 Congratulations on your Offer!</h3>
                  <p className="text-sm text-emerald-200/70">You have been selected for this role. Please check your email for the official offer letter and next steps.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
