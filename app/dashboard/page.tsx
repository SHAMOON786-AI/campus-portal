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
      .select("*")
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

  // Filter jobs dynamically based on search input
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-8 max-w-6xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/80 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-lg">
          <p className="text-gray-400 text-sm font-medium">Active Opportunities</p>
          <p className="text-3xl font-extrabold text-blue-400 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-lg">
          <p className="text-gray-400 text-sm font-medium">My Applications</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{myApplications.length}</p>
        </div>
        <div className="bg-gray-800/80 border border-gray-700 p-5 rounded-2xl backdrop-blur-sm shadow-lg">
          <p className="text-gray-400 text-sm font-medium">Portal Access</p>
          <p className="text-3xl font-extrabold text-purple-400 mt-1">Verified Student</p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by job title or company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md"
        />
      </div>

      {/* Job Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-gray-600 transition-all">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-blue-400 font-medium">{job.company}</p>
            <p className="mt-2 text-sm text-gray-300">{job.description}</p>
            <p className="mt-4 text-xs text-gray-400">Min CGPA Required: {job.min_cgpa}</p>

            <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col gap-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              <button
                onClick={() => handleApply(job.id)}
                disabled={uploading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 shadow-md"
              >
                {uploading ? "Uploading..." : "Submit Application"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}