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

      alert("Application submitted successfully!");
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
    <main className="p-8 max-w-6xl mx-auto text-white transition-all duration-500">
      {/* Header with live glowing status badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Student Dashboard
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Explore live placement opportunities and track your application status.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/80 px-4 py-2 rounded-full backdrop-blur-md shadow-inner self-start">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-300 tracking-wide uppercase">Live Portal Active</span>
        </div>
      </div>

      {/* Animated Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Active Opportunities</p>
          <p className="text-4xl font-black text-blue-400 mt-2 group-hover:scale-105 transition-transform origin-left">{jobs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">My Applications</p>
          <p className="text-4xl font-black text-emerald-400 mt-2 group-hover:scale-105 transition-transform origin-left">{myApplications.length}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl hover:-translate-y-1.5 transition-all duration-300 group">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Verification Status</p>
          <p className="text-2xl font-black text-purple-400 mt-3 group-hover:scale-105 transition-transform origin-left">Verified Student</p>
        </div>
      </div>

      {/* Application History Tracker Section */}
      <div className="mb-10 bg-gray-800/40 border border-gray-700/70 p-6 rounded-2xl backdrop-blur-md">
        <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
          <span>📋</span> My Application History
        </h2>
        {myApplications.length === 0 ? (
          <p className="text-sm text-gray-400 italic">You haven't submitted any applications yet. Pick a role below to apply!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApplications.map((app) => (
              <div key={app.id} className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">{app.jobs?.title || "Position"}</h3>
                  <p className="text-xs text-blue-400">{app.jobs?.company || "Company Name"}</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animated Search Input Bar */}
      <div className="mb-8 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
        <input
          type="text"
          placeholder="🔍 Search by job title or company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="relative w-full px-5 py-4 bg-gray-900 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xl transition-all"
        />
      </div>

      {/* Job Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div 
            key={job.id} 
            className="bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl border border-gray-700/80 shadow-xl hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{job.title}</h2>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                  Active
                </span>
              </div>
              <p className="text-blue-400 font-semibold mt-1">{job.company}</p>
              <p className="mt-3 text-sm text-gray-300 leading-relaxed">{job.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs bg-gray-900/80 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-700">
                  Min CGPA: <strong className="text-white">{job.min_cgpa}</strong>
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700/80 flex flex-col gap-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer transition-all"
              />
              <button
                onClick={() => handleApply(job.id)}
                disabled={uploading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-900/30 disabled:opacity-50 active:scale-[0.98]"
              >
                {uploading ? "Uploading Resume..." : "Submit Application 🚀"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}