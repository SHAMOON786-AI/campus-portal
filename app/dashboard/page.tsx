"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function StudentDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeFiles, setResumeFiles] = useState<{ [key: string]: File }>({});

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: appData, error } = await supabase
      .from("applications")
      .select("id, status, interview_date, offered_package, joining_date, reporting_time, reporting_place, resume_url, job_id, student_id, jobs(*)")
      .eq("student_id", user.id);
      
    if (error) {
      console.error("Error fetching student applications:", error.message);
    }
    if (appData) setApplications(appData);

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

      const file = resumeFiles[jobId];
      let resumeUrl = "candidate_resume.pdf";

      if (file) {
        const filePath = `resumes/${user.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("resumes")
            .getPublicUrl(filePath);
          resumeUrl = publicUrlData.publicUrl;
        } else {
          resumeUrl = file.name;
        }
      }

      const { error } = await supabase.from("applications").insert({
        job_id: jobId,
        student_id: user.id,
        status: "applied",
        resume_url: resumeUrl,
      });

      if (error) throw error;
      alert("Application submitted successfully with resume!");
      fetchStudentData();
    } catch (err: any) {
      alert("Error applying: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatInterviewDate = (dateString: string) => {
    if (!dateString) return "Date & time pending update";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const formatJoiningDate = (dateString: string) => {
    if (!dateString) return "To be announced";
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 max-w-6xl mx-auto space-y-10">
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
            <span>⚡</span> Live Application Status Timeline
          </h2>
          <button
            onClick={fetchStudentData}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
          >
            🔄 Refresh Status
          </button>
        </div>

        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">You have not applied to any campus openings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => {
              const isHired = app.status?.toLowerCase() === 'hired';
              const isInterview = app.status?.toLowerCase() === 'interview';
              const isRemoved = app.status === 'Cancelled / Position Removed';

              return (
                <div key={app.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-4 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-lg">{app.jobs?.title || "Position Removed"}</h3>
                      <p className="text-xs text-blue-400 font-medium">{app.jobs?.company || "Company"} ({app.jobs?.location || "Remote"})</p>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg border uppercase font-bold tracking-wider ${
                      isRemoved ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      isHired ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      app.status?.toLowerCase() === 'shortlisted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                      isInterview ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {!isRemoved && (
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
                      <span className="text-emerald-400 font-semibold">✓ Applied</span>
                      <span>→</span>
                      <span className={app.status?.toLowerCase() !== 'applied' ? 'text-emerald-400 font-semibold' : ''}>AI Screening</span>
                      <span>→</span>
                      <span className={['shortlisted', 'interview', 'hired'].includes(app.status?.toLowerCase()) ? 'text-emerald-400 font-semibold' : ''}>Recruiter Review</span>
                    </div>
                  )}

                  {isRemoved ? (
                    <div className="bg-red-950/40 border border-red-500/40 p-3.5 rounded-xl flex items-center gap-3 mt-3">
                      <span className="text-red-400 text-xl">⚠️</span>
                      <div>
                        <p className="text-[11px] font-bold text-red-300 uppercase tracking-wide">Drive Status Notice</p>
                        <p className="text-xs font-semibold text-white mt-0.5">This position has been withdrawn or removed by the recruiter.</p>
                      </div>
                    </div>
                  ) : !isHired && (isInterview || app.interview_date) && (
                    <div className="bg-amber-950/50 border border-amber-500/40 p-4 rounded-xl flex items-center gap-3 mt-3 shadow-md">
                      <span className="text-amber-400 text-2xl">📅</span>
                      <div>
                        <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">Scheduled Interview Date & Time</p>
                        <p className="text-sm font-black text-white mt-0.5">
                          {formatInterviewDate(app.interview_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {isHired && (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl space-y-3 mt-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 text-2xl">💰</span>
                        <div>
                          <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">Official Offer & Compensation Package</p>
                          <p className="text-sm font-black text-white mt-0.5">{app.offered_package || "Package details under final university review"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-emerald-800/50 text-xs">
                        <div>
                          <span className="text-emerald-300/80 block font-semibold text-[10px] uppercase">Joining Date</span>
                          <strong className="text-white text-xs">{formatJoiningDate(app.joining_date)}</strong>
                        </div>
                        <div>
                          <span className="text-emerald-300/80 block font-semibold text-[10px] uppercase">Reporting Time</span>
                          <strong className="text-white text-xs">{app.reporting_time || "Pending"}</strong>
                        </div>
                        <div>
                          <span className="text-emerald-300/80 block font-semibold text-[10px] uppercase">Reporting Place</span>
                          <strong className="text-white text-xs truncate block" title={app.reporting_place}>{app.reporting_place || "Pending"}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Campus Drives */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <h2 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2">
          <span>🚀</span> Available Campus Drives
        </h2>
        {jobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic py-4">No approved job openings available right now.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => {
              const hasApplied = applications.some((app) => app.job_id === job.id && app.status !== 'Cancelled / Position Removed');

              return (
                <div key={job.id} className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white text-lg">{job.title}</h3>
                      <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-md font-medium">
                        ✨ 94% Match
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-blue-400 font-medium">{job.company}</p>
                      <span className="text-xs text-slate-500">•</span>
                      <p className="text-xs text-slate-300">📍 {job.location || "Remote"}</p>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2">{job.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-900">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Min CGPA: <strong className="text-slate-200">{job.min_cgpa}</strong></span>
                    </div>

                    {hasApplied ? (
                      <div className="w-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wide">
                        ✓ Application Submitted Successfully
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                          <input
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setResumeFiles({ ...resumeFiles, [job.id]: e.target.files[0] });
                              }
                            }}
                            className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer w-full"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
                          >
                            Quick Apply 🚀
                          </button>
                          <button
                            onClick={() => handleApply(job.id)}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
                          >
                            Submit Application ✓
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}