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
  
  // Track package input state per application ID
  const [packageInputs, setPackageInputs] = useState<{ [key: string]: string }>({});

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
    if (appData) {
      setApplications(appData);
      // Initialize package input states
      const pkgs: { [key: string]: string } = {};
      appData.forEach((app) => {
        pkgs[app.id] = app.offered_package || "";
      });
      setPackageInputs(pkgs);
    }
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
      alert("Opening published successfully! Pending university admin clearance.");
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
    const updatePayload: any = { status: newStatus };
    if (newStatus === "hired") {
      updatePayload.offered_package = packageInputs[appId] || "Stipend / CTC Disclosed";
    }

    const { error } = await supabase
      .from("applications")
      .update(updatePayload)
      .eq("id", appId);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      alert(`Candidate pipeline status updated to: ${newStatus.toUpperCase()}`);
      fetchRecruiterData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Recruiter Enterprise Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage campus drives, evaluate candidate pipelines, and assign compensation packages.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-md">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Corporate Partner Verified</span>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Active Postings</p>
          <p className="text-3xl font-black text-blue-400 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Total Applicants</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{applications.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Candidates Hired</p>
          <p className="text-3xl font-black text-purple-400 mt-1">
            {applications.filter(a => a.status === 'hired').length}
          </p>
        </div>
      </div>

      {/* Job Post Form */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl mb-10 shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-indigo-300 flex items-center gap-2">
          <span>💼</span> Publish Campus Placement / Internship Drive
        </h2>
        <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Role Title (e.g., SDE Intern - Backend)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            type="text"
            placeholder="Organization Name (e.g., TechCorp Global)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Minimum CGPA Cutoff (e.g., 7.5)"
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            required
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <textarea
            placeholder="Comprehensive Job Specification and Tech Stack..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="md:col-span-2 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 md:col-span-1 self-end h-[50px]"
          >
            {loading ? "Broadcasting..." : "Publish Drive 🚀"}
          </button>
        </form>
      </div>

      {/* Candidate Pipeline Review */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
          <span>👥</span> Applicant Evaluation & Compensation Pipeline
        </h2>
        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No candidate submissions recorded yet for your active drives.</p>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-4 hover:border-slate-700 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-lg">{app.jobs?.title || "Position"}</h3>
                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-md font-medium">
                        {app.jobs?.company || "Company"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Candidate Ref ID: <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">{app.student_id}</code></p>
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 mt-1 font-medium">
                        📄 Review Candidate Resume (PDF/Docx)
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
                    <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                      app.status === 'hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      app.status === 'shortlisted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      app.status === 'interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {app.status}
                    </span>
                    <select
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      defaultValue={app.status}
                      className="bg-slate-900 border border-slate-700 text-xs text-white px-3 py-2 rounded-xl outline-none cursor-pointer hover:border-slate-500 transition-all font-medium"
                    >
                      <option value="applied">Review: Applied</option>
                      <option value="shortlisted">✨ Shortlist Candidate</option>
                      <option value="interview">📅 Schedule Interview</option>
                      <option value="hired">🎉 Offer Extended / Hired</option>
                      <option value="rejected">❌ Not Selected</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Compensation Input/Display for Hired Candidates */}
                {(app.status === 'hired' || app.offered_package) && (
                  <div className="bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-base">💰</span>
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 uppercase">Final Offered Compensation / Package</p>
                        <p className="text-sm font-bold text-white">{app.offered_package || "Not yet specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="e.g., $120,000 CTC or $5,000/mo"
                        value={packageInputs[app.id] || ""}
                        onChange={(e) => setPackageInputs({ ...packageInputs, [app.id]: e.target.value })}
                        className="bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg outline-none w-full md:w-64"
                      />
                      <button
                        onClick={() => updateApplicationStatus(app.id, 'hired')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shrink-0"
                      >
                        Save Package
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}