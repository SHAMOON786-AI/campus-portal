"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: jobData } = await supabase
      .from("jobs")
      .select("*")
      .eq("recruiter_id", user.id);
    if (jobData) setJobs(jobData);

    const { data: appData } = await supabase
      .from("applications")
      .select("*, jobs(*)")
      .eq("jobs.recruiter_id", user.id);
    if (appData) setApplications(appData);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("jobs").insert({
        title,
        company,
        description,
        min_cgpa: parseFloat(minCgpa),
        recruiter_id: user.id,
        status: "pending",
      });

      if (error) throw error;
      alert("Job posted successfully! Awaiting admin approval.");
      setTitle("");
      setCompany("");
      setDescription("");
      setMinCgpa("");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error posting job: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      alert(`Candidate status updated to ${newStatus}!`);
      fetchRecruiterData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Recruiter Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Post opportunities and manage applicant pipelines.</p>
        </div>
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-4 py-2 rounded-full font-semibold">
          Recruiter Portal Active
        </span>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl mb-10 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-indigo-300">✨ Post a New Campus Opening</h2>
        <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Job Title (e.g., Software Engineer)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Company Name (e.g., Google)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Min CGPA Required (e.g., 7.5)"
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <textarea
            placeholder="Job Description & Requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className="md:col-span-2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg md:col-span-1"
          >
            {loading ? "Posting..." : "Publish Listing 🚀"}
          </button>
        </form>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400">📋 Candidate Pipeline & Resume Review</h2>
        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No candidate applications received yet for your listings.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white">{app.jobs?.title || "Role Position"}</h3>
                  <p className="text-xs text-blue-400">Candidate ID: {app.student_id.slice(0, 8)}...</p>
                  {app.resume_url && (
                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 underline mt-1 inline-block">
                      📄 View Uploaded Resume
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 uppercase font-semibold text-emerald-400">
                    {app.status}
                  </span>
                  <select
                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                    defaultValue={app.status}
                    className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="applied">Applied</option>
                    <option value="shortlisted">Shortlisted ✨</option>
                    <option value="interview">Interview Scheduled 📅</option>
                    <option value="hired">Hired 🎉</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}