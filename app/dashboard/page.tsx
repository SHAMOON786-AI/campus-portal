"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  // NEW: State to hold the full application details (including status)
  const [myApplications, setMyApplications] = useState<any[]>([]);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    // NEW: Fetch the status alongside the job_id
    const { data } = await supabase
      .from("applications")
      .select("job_id, status")
      .eq("student_id", user.id);
    if (data) {
      setMyApplications(data);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!resumeFile) {
      alert("Please select a resume PDF to upload before applying.");
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = resumeFile.name.split('.').pop();
    const fileName = `${user.id}-${jobId}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(fileName, resumeFile);

    if (uploadError) {
      alert("Error uploading resume: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from("applications")
      .insert([{ 
        job_id: jobId, 
        student_id: user.id,
        resume_url: publicUrl 
      }]);

    if (dbError) {
      alert("Error applying: " + dbError.message);
    } else {
      alert("Application and resume submitted successfully!");
      // Instantly update UI with the new 'applied' status
      setMyApplications([...myApplications, { job_id: jobId, status: 'applied' }]);
      setResumeFile(null); 
    }
    setUploading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-black text-white">
      <div className="w-full max-w-4xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push("/profile")} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition-colors">
              My Profile
            </button>
            <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors">
              Sign Out
            </button>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Available Approved Jobs</h2>
        
        {jobs.length === 0 ? (
          <p className="text-gray-400">No jobs available right now.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => {
              // NEW: Find the specific application to check its real-time status
              const application = myApplications.find(app => app.job_id === job.id);
              const hasApplied = !!application;
              
              return (
                <div key={job.id} className="p-6 border border-gray-700 rounded bg-gray-800">
                  <h3 className="font-bold text-xl text-blue-400">{job.title}</h3>
                  <p className="text-sm font-semibold text-gray-300">{job.company}</p>
                  <p className="text-sm text-gray-400 mt-2 mb-4">{job.description}</p>
                  
                  {hasApplied ? (
                    // NEW: Dynamic color coding based on application status
                    <button disabled className={`font-bold py-2 px-4 rounded cursor-not-allowed uppercase text-sm tracking-wider ${
                      application.status === 'shortlisted' ? 'bg-green-900/50 text-green-400 border border-green-700' :
                      application.status === 'rejected' ? 'bg-red-900/50 text-red-400 border border-red-700' :
                      'bg-gray-700 text-gray-400 border border-gray-600'
                    }`}>
                      {application.status}
                    </button>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col gap-3">
                      <label className="text-sm text-gray-300 font-semibold">Upload Resume (PDF)</label>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-blue-300 hover:file:bg-blue-800 cursor-pointer"
                      />
                      <button 
                        onClick={() => handleApply(job.id)}
                        disabled={uploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-max mt-2 transition-colors disabled:opacity-50"
                      >
                        {uploading ? "Uploading..." : "Submit Application"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}