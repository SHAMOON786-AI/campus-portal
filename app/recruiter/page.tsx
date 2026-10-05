"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RecruiterDashboard() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  
  const [applicants, setApplicants] = useState<any[]>([]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    // NEW: Added resume_url to the select query
    const { data: appsData } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        student_id,
        resume_url,
        jobs ( title, company )
      `);
    
    if (!appsData) return;

    const studentIds = [...new Set(appsData.map(app => app.student_id))];

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, name, branch, cgpa, email")
      .in("id", studentIds);

    const mergedData = appsData.map(app => {
      const profile = profilesData?.find(p => p.id === app.student_id);
      return { ...app, profile };
    });

    setApplicants(mergedData);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("jobs")
      .insert([
        {
          title,
          company,
          description,
          min_cgpa: minCgpa,
          status: 'pending'
        }
      ]);

    if (error) {
      alert("Error posting job: " + error.message);
    } else {
      alert("Job posted successfully! Pending admin approval.");
      setTitle("");
      setCompany("");
      setDescription("");
      setMinCgpa("");
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      setApplicants(applicants.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-black text-white">
      <div className="w-full max-w-6xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <button 
            onClick={handleSignOut}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-6 bg-gray-800 rounded border border-gray-700 h-fit">
            <h2 className="text-xl font-semibold mb-4">Post a New Job</h2>
            <form onSubmit={handlePostJob} className="flex flex-col gap-4">
              <input type="text" placeholder="Job Title" required value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white" />
              <input type="text" placeholder="Company Name" required value={company} onChange={(e) => setCompany(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white" />
              <textarea placeholder="Job Description" required value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white h-24" />
              <input type="number" step="0.1" placeholder="Minimum CGPA" required value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">Submit for Approval</button>
            </form>
          </div>

          <div className="p-6 bg-gray-800 rounded border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Recent Applications</h2>
            {applicants.length === 0 ? (
              <p className="text-sm text-gray-400">No applications received yet.</p>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-2">
                {applicants.map((app) => (
                  <div key={app.id} className="p-4 border border-gray-600 rounded bg-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-blue-400">{app.jobs?.title}</p>
                        <p className="text-sm font-semibold">{app.jobs?.company}</p>
                      </div>
                      <span className={`text-xs uppercase tracking-wider font-bold px-2 py-1 rounded ${
                        app.status === 'shortlisted' ? 'bg-green-900/50 text-green-400' :
                        app.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-sm text-white font-medium">Applicant: {app.profile?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-300 mt-1">{app.profile?.branch || "No branch specified"} • CGPA: {app.profile?.cgpa || "N/A"}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">Contact: {app.profile?.email || app.student_id}</p>
                      
                      {/* NEW: View Resume Button */}
                      {app.resume_url && (
                        <a 
                          href={app.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-block mt-3 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
                        >
                          View Resume (PDF)
                        </a>
                      )}
                    </div>

                    {app.status === 'applied' && (
                      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-700">
                        <button onClick={() => handleUpdateStatus(app.id, 'shortlisted')} className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                          Shortlist
                        </button>
                        <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors">
                          Reject
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}