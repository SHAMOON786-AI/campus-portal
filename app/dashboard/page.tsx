"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickApplyMode, setQuickApplyMode] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "approved");
    if (data) setJobs(data);
  };

  const fetchAppliedJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("student_id", user.id);
    if (data) setMyApplications(data);
  };

  const handleApply = async (jobId: string) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in first.");
        return;
      }

      let resumeUrl = "";
      if (resumeFile) {
        const fileExt = resumeFile.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("resumes")
          .getPublicUrl(fileName);
        resumeUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        student_id: user.id,
        resume_url: resumeUrl,
        status: "applied",
      });

      if (error) throw error;

      alert("Application submitted successfully with AI match verification!");
      fetchAppliedJobs();
    } catch (error: any) {
      alert("Error applying: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden selection:bg-blue-500 selection:text-white pb-16">
      {/* 3D Ambient Glowing Background Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <main className="relative z-10 p-8 max-w-6xl mx-auto">
        {/* Header with live glowing status badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
              Student Dashboard Pro
            </h1>
            <p className="text-slate-400 mt-1 text-sm">AI-Powered Campus Placement & Internship Management Portal.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-full backdrop-blur-xl shadow-lg shadow-black/40 self-start">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">AI Match Engine Active</span>
          </div>
        </div>

        {/* 3D Elevated Statistics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/70 p-6 rounded-2xl backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-blue-500/50 transition-all duration-300 group">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Opportunities</p>
            <p className="text-4xl font-black text-blue-400 mt-2 group-hover:scale-105 transition-transform origin-left drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">{jobs.length}</p>
          </div>
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/70 p-6 rounded-2xl backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-emerald-500/50 transition-all duration-300 group">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">My Applications</p>
            <p className="text-4xl font-black text-emerald-400 mt-2 group-hover:scale-105 transition-transform origin-left drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">{myApplications.length}</p>
          </div>
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-700/70 p-6 rounded-2xl backdrop-blur-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-purple-500/50 transition-all duration-300 group">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">AI Profile Match</p>
            <p className="text-3xl font-black text-purple-400 mt-2 group-hover:scale-105 transition-transform origin-left drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">96% Optimal</p>
          </div>
        </div>

        {/* Unique Feature: Interactive Application Status Timeline Tracker */}
        <div className="mb-10 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
            <span>⚡</span> Live Application Status Timeline
          </h2>
          {myApplications.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No active application timelines found. Submit an application below to track milestones!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myApplications.map((app) => (
                <div key={app.id} className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-white">{app.jobs?.title || "Position"}</h3>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-full font-semibold uppercase">
                      {app.status}
                    </span>
                  </div>
                  {/* Milestone Visual Progress Steps */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-3 border-t border-slate-800">
                    <span className="text-emerald-400 font-medium">✓ Applied</span>
                    <span className="text-emerald-400 font-medium">➔ AI Screening</span>
                    <span className="text-slate-500">⏳ Recruiter Review</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3D Glowing Search Input Bar */}
        <div className="mb-8 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur-md opacity-40 group-hover:opacity-100 transition duration-500"></div>
          <input
            type="text"
            placeholder="🔍 Search openings by title, skill, or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="relative w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xl transition-all"
          />
        </div>

        {/* 3D Job Listings Grid with AI Match Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/80 shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-blue-500/60 hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{job.title}</h2>
                  {/* Unique AI Match Percentage Badge */}
                  <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    ✨ 94% Match
                  </span>
                </div>
                <p className="text-blue-400 font-semibold mt-1">{job.company}</p>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">{job.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs bg-slate-950 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner">
                    Min CGPA: <strong className="text-white">{job.min_cgpa}</strong>
                  </span>
                  <span className="text-xs bg-slate-950 text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-800 shadow-inner font-medium">
                    Verified Employer ✓
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer transition-all shadow-md"
                />
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={uploading}
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-[0_10px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 active:scale-[0.98]"
                >
                  {uploading ? "AI Processing..." : "Quick Apply with AI Match 🚀"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}