"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const POPULAR_LOCATIONS = [
  "Bangalore, India", "Hyderabad, India", "Pune, India", "Mumbai, India",
  "Chennai, India", "Delhi NCR, India", "Gurugram, India", "Noida, India",
  "Kolkata, India", "Ahmedabad, India", "Kochi, India", "Thiruvananthapuram, India",
  "Coimbatore, India", "Indore, India", "Jaipur, India", "Chandigarh, India",
  "San Francisco, USA", "New York, USA", "Seattle, USA", "Austin, USA",
  "London, UK", "Berlin, Germany", "Toronto, Canada", "Singapore, Singapore", "Remote / Work From Home"
];

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [description, setDescription] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [packageInputs, setPackageInputs] = useState<{ [key: string]: string }>({});
  const [interviewInputs, setInterviewInputs] = useState<{ [key: string]: string }>({});
  
  const [joiningDateInputs, setJoiningDateInputs] = useState<{ [key: string]: string }>({});
  const [reportingTimeInputs, setReportingTimeInputs] = useState<{ [key: string]: string }>({});
  const [reportingPlaceInputs, setReportingPlaceInputs] = useState<{ [key: string]: string }>({});

  const currentDateTimeMin = new Date().toISOString().slice(0, 16);
  const currentDateMin = new Date().toISOString().slice(0, 10);

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
      const pkgs: { [key: string]: string } = {};
      const intvs: { [key: string]: string } = {};
      const joinDates: { [key: string]: string } = {};
      const repTimes: { [key: string]: string } = {};
      const repPlaces: { [key: string]: string } = {};

      appData.forEach((app) => {
        pkgs[app.id] = app.offered_package || "";
        intvs[app.id] = app.interview_date ? new Date(app.interview_date).toISOString().slice(0, 16) : "";
        joinDates[app.id] = app.joining_date || "";
        repTimes[app.id] = app.reporting_time || "";
        repPlaces[app.id] = app.reporting_place || "";
      });

      setPackageInputs(pkgs);
      setInterviewInputs(intvs);
      setJoiningDateInputs(joinDates);
      setReportingTimeInputs(repTimes);
      setReportingPlaceInputs(repPlaces);
    }
  };

  const handleLocationChange = (val: string) => {
    setLocation(val);
    if (val.trim() === "") {
      setFilteredLocations([]);
      setShowDropdown(false);
    } else {
      const matches = POPULAR_LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredLocations(matches);
      setShowDropdown(true);
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
        location,
        description,
        min_cgpa: parseFloat(minCgpa),
        recruiter_id: user.id,
        status: "pending",
      });

      if (error) throw error;
      alert("Opening published successfully! Pending university admin clearance.");
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setMinCgpa("");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error posting job: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job drive? Students will be notified.")) return;

    try {
      await supabase
        .from("applications")
        .update({ status: "Cancelled / Position Removed" })
        .eq("job_id", jobId);

      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;

      alert("Job drive deleted successfully.");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error deleting job: " + err.message);
    }
  };

  const handleDeleteAllJobs = async () => {
    if (jobs.length === 0) {
      alert("No active job drives to delete.");
      return;
    }

    if (!confirm(`WARNING: Are you sure you want to delete ALL (${jobs.length}) of your job drives? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const jobIds = jobs.map(j => j.id);

      await supabase
        .from("applications")
        .update({ status: "Cancelled / Position Removed" })
        .in("job_id", jobIds);

      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("recruiter_id", user.id);

      if (error) throw error;

      alert("All job drives have been successfully deleted.");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error deleting all jobs: " + err.message);
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    const updatePayload: any = { status: newStatus };

    // If status is changed back to 'applied' (or anything other than interview/hired), wipe old data
    if (newStatus === "applied" || newStatus === "rejected" || newStatus === "shortlisted") {
      updatePayload.interview_date = null;
      updatePayload.offered_package = null;
      updatePayload.joining_date = null;
      updatePayload.reporting_time = null;
      updatePayload.reporting_place = null;
    } else if (newStatus === "hired") {
      updatePayload.offered_package = packageInputs[appId] || "Stipend / CTC Disclosed";
      updatePayload.joining_date = joiningDateInputs[appId] || null;
      updatePayload.reporting_time = reportingTimeInputs[appId] || null;
      updatePayload.reporting_place = reportingPlaceInputs[appId] || null;
    } else if (newStatus === "interview" && interviewInputs[appId]) {
      updatePayload.interview_date = interviewInputs[appId];
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

  const saveInterviewSchedule = async (appId: string) => {
    const selectedDate = interviewInputs[appId];
    if (!selectedDate || new Date(selectedDate) < new Date()) {
      alert("Please select a valid future date and time for the interview.");
      return;
    }

    const { error } = await supabase
      .from("applications")
      .update({ 
        status: "interview",
        interview_date: selectedDate 
      })
      .eq("id", appId);

    if (error) {
      alert("Error saving schedule: " + error.message);
    } else {
      alert("Interview date and time scheduled successfully!");
      fetchRecruiterData();
    }
  };

  const saveHiredDetails = async (appId: string) => {
    const { error } = await supabase
      .from("applications")
      .update({
        status: "hired",
        offered_package: packageInputs[appId] || "Stipend / CTC Disclosed",
        joining_date: joiningDateInputs[appId] || null,
        reporting_time: reportingTimeInputs[appId] || null,
        reporting_place: reportingPlaceInputs[appId] || null,
      })
      .eq("id", appId);

    if (error) {
      alert("Error saving offer and onboarding details: " + error.message);
    } else {
      alert("Offer package and onboarding details saved successfully!");
      fetchRecruiterData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Recruiter Enterprise Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage campus drives, evaluate candidate pipelines, and manage onboarding.</p>
        </div>
        <div className="flex items-center gap-3">
          {jobs.length > 0 && (
            <button
              onClick={handleDeleteAllJobs}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-md flex items-center gap-1.5"
            >
              Delete All Drives 🗑️
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-md">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">Corporate Partner Verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Active Postings</p>
          <p className="text-3xl font-black text-blue-400 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Total Applicants</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{applications.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-slate-400 text-xs uppercase font-semibold">Candidates Hired</p>
          <p className="text-3xl font-black text-purple-400 mt-1">
            {applications.filter(a => a.status === 'hired').length}
          </p>
        </div>
      </div>

      {/* Publish Job Form */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
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
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search City, State Capital or Hub..."
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {showDropdown && filteredLocations.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredLocations.map((loc, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setLocation(loc);
                      setShowDropdown(false);
                    }}
                    className="px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer transition-all border-b border-slate-800/50 last:border-none"
                  >
                    📍 {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>

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

      {/* Manage Active Job Drives */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <span>📋</span> Manage Active Job Drives
          </h2>
          {jobs.length > 0 && (
            <button
              onClick={handleDeleteAllJobs}
              className="text-xs bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              Delete All Drives 🗑️
            </button>
          )}
        </div>
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No active job postings created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-lg">{job.title}</h3>
                    <span className="text-[11px] bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-md uppercase font-semibold">
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-blue-400 font-medium">{job.company}</p>
                    <span className="text-xs text-slate-500">•</span>
                    <p className="text-xs text-slate-300">📍 {job.location || "Location not specified"}</p>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2">{job.description}</p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                  <span className="text-xs text-slate-400">Min CGPA: <strong className="text-slate-200">{job.min_cgpa}</strong></span>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    Delete Drive 🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Applicant Evaluation Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
          <span>👥</span> Applicant Evaluation & Offer Onboarding Pipeline
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
                        {app.jobs?.company || "Company"} ({app.jobs?.location || "Remote"})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Candidate Ref ID: <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">{app.student_id}</code></p>
                    
                    {app.resume_url ? (
                      <a 
                        href={app.resume_url.startsWith('http') ? app.resume_url : `#`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1 mt-1 font-medium"
                      >
                        📄 Review Candidate Resume ({app.resume_url.split('/').pop() || "PDF/Docx"})
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-1">No resume attached</p>
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

                {/* Interview Schedule Box */}
                {app.status === 'interview' && (
                  <div className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-base">📅</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-300 uppercase">Scheduled Interview Date & Time</p>
                        <p className="text-sm font-bold text-white">
                          {app.interview_date ? new Date(app.interview_date).toLocaleString() : "Select future date & time"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="datetime-local"
                        min={currentDateTimeMin}
                        value={interviewInputs[app.id] || ""}
                        onChange={(e) => setInterviewInputs({ ...interviewInputs, [app.id]: e.target.value })}
                        className="bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg outline-none w-full md:w-56 cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                      />
                      <button
                        onClick={() => saveInterviewSchedule(app.id)}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shrink-0 shadow-md"
                      >
                        Set Interview
                      </button>
                    </div>
                  </div>
                )}

                {/* Hired / Compensation & Onboarding Details Box */}
                {(app.status === 'hired' || app.offered_package) && (
                  <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-xl space-y-3 mt-2">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-base">💰</span>
                        <div>
                          <p className="text-xs font-semibold text-emerald-300 uppercase">Final Offered Compensation / Package</p>
                          <p className="text-sm font-bold text-white">{app.offered_package || "Stipend / CTC Disclosed"}</p>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Stipend / CTC (e.g. 1000000)"
                        value={packageInputs[app.id] || ""}
                        onChange={(e) => setPackageInputs({ ...packageInputs, [app.id]: e.target.value })}
                        className="bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-lg outline-none w-full md:w-56"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Joining Date</label>
                        <input
                          type="date"
                          min={currentDateMin}
                          value={joiningDateInputs[app.id] || ""}
                          onChange={(e) => setJoiningDateInputs({ ...joiningDateInputs, [app.id]: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg outline-none w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Reporting Time (24h)</label>
                        <input
                          type="time"
                          value={reportingTimeInputs[app.id] || ""}
                          onChange={(e) => setReportingTimeInputs({ ...reportingTimeInputs, [app.id]: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-xs text-white px-3 py-2 rounded-lg outline-none w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Reporting Place / Venue</label>
                        <input
                          type="text"
                          placeholder="e.g. HQ Block A, Bangalore / Virtual Link"
                          value={reportingPlaceInputs[app.id] || ""}
                          onChange={(e) => setReportingPlaceInputs({ ...reportingPlaceInputs, [app.id]: e.target.value })}
                          className="bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 px-3 py-2 rounded-lg outline-none w-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => saveHiredDetails(app.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                      >
                        💾 Save Offer & Onboarding Details
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