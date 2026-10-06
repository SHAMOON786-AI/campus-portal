"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function StudentDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch student's applications including job details and offered package
    const { data: appData } = await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("student_id", user.id);
    if (appData) setApplications(appData);

    // Fetch available approved jobs
    const { data: jobData } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "approved");
    if (jobData) setJobs(jobData);
  };

  const handleApply = async (jobId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        student_id: user.id,
        status: "applied",
      });

      if (error) throw error;
      alert("Application submitted successfully!");
      fetchStudentData();
    } catch (err: any) {
      alert("Error applying: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Student Dashboard Pro
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Campus Placement & Internship Management Portal.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">AI Match Engine Active</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Active Opportunities</p>
          <p className="text-3xl font-black text-blue-400 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">My Applications</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{applications.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">AI Profile Match</p>
          <p className="text-3xl font-black text-purple-400 mt-1">96% Optimal</p>
        </div>
      </div>

      {/* Live Application Status Timeline */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-6 text-indigo-300 flex items-center gap-2">
          <span>⚡</span> Live Application Status Timeline
        </h2>
        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">You have not applied to any campus openings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-4 hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{app.jobs?.title || "Position"}</h3>
                    <p className="text-xs text-blue-400 font-medium">{app.jobs?.company || "Company"}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                    app.status === 'hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    app.status === 'shortlisted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                    app.status === 'interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {app.status}
                  </span>
                </div>

                {/* Status Timeline Indicator */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
                  <span className="text-emerald-400 font-semibold">✓ Applied</span>
                  <span>→</span>
                  <span className={app.status !== 'applied' ? 'text-emerald-400 font-semibold' : ''}>AI Screening</span>
                  <span>→</span>
                  <span className={['shortlisted', 'interview', 'hired'].includes(app.status) ? 'text-emerald-400 font-semibold' : ''}>Recruiter Review</span>
                </div>

                {/* Display Offered Compensation Package if Hired */}
                {app.status === 'hired' && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 mt-3 shadow-inner">
                    <span className="text-emerald-400 text-2xl">💰</span>
                    <div>
                      <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">Official Offer & Compensation Package</p>
                      <p className="text-sm font-black text-white mt-0.5">{app.offered_package || "Stipend/CTC details pending update"}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Openings */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
          <span>🚀</span> Available Campus Drives
        </h2>
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No approved job openings available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">{job.title}</h3>
                    <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-md font-medium">
                      ✨ 94% Match
                    </span>
                  </div>
                  <p className="text-xs text-blue-400 font-medium">{job.company}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2">{job.description}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                  <span className="text-xs text-slate-400">Min CGPA: <strong className="text-slate-200">{job.min_cgpa}</strong></span>
                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md"
                  >
                    Quick Apply 🚀
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}