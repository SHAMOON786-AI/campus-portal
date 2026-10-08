"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function RecruiterDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Company Profile
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ company_name: "", description: "" });

  // Job Posting State
  const [showJobForm, setShowJobForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    min_cgpa: "",
    allowed_departments: "",
  });

  // Batch Updates
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());

  // Offer Management State
  const [offerDetails, setOfferDetails] = useState<{ [key: string]: any }>({});
  const [interviewDates, setInterviewDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch Company Profile
    const { data: profile } = await supabase.from("company_profiles").select("*").eq("recruiter_id", user.id).single();
    if (profile) {
      setCompanyProfile(profile);
      setCompanyForm(profile);
      // Auto-fill company name in jobs if available
      setNewJob(prev => ({ ...prev, company: profile.company_name }));
    }

    const { data: jobData } = await supabase.from("jobs").select("*").eq("recruiter_id", user.id);
    if (jobData) setJobs(jobData);

    // Fetch applications for this recruiter's jobs
    if (jobData && jobData.length > 0) {
      const jobIds = jobData.map(j => j.id);
      const { data: appData, error } = await supabase
        .from("applications")
        .select("*, jobs(*), profiles(*)")
        .in("job_id", jobIds);
      if (error) console.error("Error fetching applications:", error.message);
      if (appData) setApplications(appData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: any = {
      company_name: companyForm.company_name,
      description: companyForm.description,
      recruiter_id: user.id
    };
    if (companyProfile?.id) payload.id = companyProfile.id;

    const { error } = companyProfile?.id
      ? await supabase.from("company_profiles").update(payload).eq("id", companyProfile.id)
      : await supabase.from("company_profiles").insert([payload]);
    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      alert("Company profile saved! If pending, wait for admin approval.");
      setIsEditingCompany(false);
      fetchRecruiterData();
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from("jobs").insert([{
        title: newJob.title,
        company: newJob.company,
        location: newJob.location,
        description: newJob.description,
        min_cgpa: parseFloat(newJob.min_cgpa) || 0,
        allowed_departments: newJob.allowed_departments ? newJob.allowed_departments.split(",").map(d => d.trim()) : [],
        status: "pending", // Requires Admin approval
        recruiter_id: user.id
      }]);

      if (error) throw error;

      alert("Campus Drive posted and sent to Admin for approval!");
      setNewJob({ title: "", company: companyProfile.company_name, location: "", description: "", min_cgpa: "", allowed_departments: "" });
      setShowJobForm(false);
      fetchRecruiterData(); 
    } catch (err: any) {
      alert("Error posting job: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("applications").update({ status }).eq("id", id);
      if (error) throw error;
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error updating status: " + err.message);
    }
  };

  const toggleSelectApplicant = (id: string) => {
    const newSet = new Set(selectedApplicants);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedApplicants(newSet);
  };

  const handleBatchStatusUpdate = async (status: string) => {
    if (selectedApplicants.size === 0) return alert("Select at least one applicant.");
    try {
      const { error } = await supabase.from("applications").update({ status }).in("id", Array.from(selectedApplicants));
      if (error) throw error;
      alert(`Successfully updated ${selectedApplicants.size} applicants to ${status}.`);
      setSelectedApplicants(new Set());
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error in batch update: " + err.message);
    }
  };

  const scheduleInterview = async (id: string) => {
    if (!interviewDates[id]) return alert("Please select a date and time.");
    try {
      const { error } = await supabase.from("applications").update({ 
        interview_date: interviewDates[id],
        status: "interview" 
      }).eq("id", id);
      if (error) throw error;
      alert("Interview scheduled successfully!");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error scheduling interview: " + err.message);
    }
  };

  const saveOfferDetails = async (id: string) => {
    const details = offerDetails[id];
    if (!details?.offered_package) return alert("Package details are required to make an offer.");
    
    try {
      const { error } = await supabase.from("applications").update({
        offered_package: details.offered_package,
        joining_date: details.joining_date,
        reporting_time: details.reporting_time,
        reporting_place: details.reporting_place,
        status: "hired"
      }).eq("id", id);
      
      if (error) throw error;
      alert("Offer details saved and candidate officially hired!");
      fetchRecruiterData();
    } catch (err: any) {
      alert("Error saving offer: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-900/20 blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-cyan-900/10 blur-[120px]"></div>
      </div>
      
      <div className="p-8 max-w-6xl mx-auto space-y-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Enterprise Recruiter Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage company profile, drives, and batch hire top talent.</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-md flex items-center gap-2"
        >
          Sign Out 🚪
        </button>
      </div>

      {/* Company Profile Section */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2"><span>🏢</span> Company Profile</h2>
          <button onClick={() => setIsEditingCompany(!isEditingCompany)} className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all">
            {isEditingCompany ? "Cancel" : "Edit Company Info"}
          </button>
        </div>

        {isEditingCompany ? (
          <form onSubmit={handleUpdateCompany} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Company Name" required value={companyForm.company_name || ""} onChange={e => setCompanyForm({...companyForm, company_name: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm md:col-span-2" />
            <textarea placeholder="Company Description" required value={companyForm.description || ""} onChange={e => setCompanyForm({...companyForm, description: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm md:col-span-2" rows={3}></textarea>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl md:col-span-2 shadow-md">Save Profile</button>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div><span className="block text-slate-500 text-xs uppercase font-semibold">Company Name</span><strong className="text-white text-base">{companyProfile?.company_name || "N/A"}</strong></div>
            <div><span className="block text-slate-500 text-xs uppercase font-semibold">Description</span><span className="text-white text-sm line-clamp-3">{companyProfile?.description || "N/A"}</span></div>
          </div>
        )}
      </div>

      {/* Job Posting Section */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <span>🚀</span> Campus Drives Management
          </h2>
          <button
            onClick={() => setShowJobForm(!showJobForm)}
            className={`${showJobForm ? 'bg-slate-700 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'} text-white text-sm font-bold py-2 px-4 rounded-xl transition-all shadow-md`}
          >
            {showJobForm ? "Cancel Posting" : "+ Post New Drive"}
          </button>
        </div>

        {showJobForm && (
          <form onSubmit={handlePostJob} className="space-y-4 pt-6 mt-4 border-t border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Job Title</label>
                <input type="text" required value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. Software Engineering Intern" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                <input type="text" required value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. Tech Corp" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Location</label>
                <input type="text" required value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. Remote, Bangalore" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Minimum CGPA Requirement</label>
                <input type="number" step="0.1" required value={newJob.min_cgpa} onChange={(e) => setNewJob({...newJob, min_cgpa: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. 7.5" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Allowed Departments (Comma separated)</label>
                <input type="text" value={newJob.allowed_departments} onChange={(e) => setNewJob({...newJob, allowed_departments: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="e.g. CSE, IT, ECE (Leave blank for all)" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Job Description</label>
              <textarea required rows={3} value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Describe the role..."></textarea>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2">
              {isSubmitting ? "Publishing to Portal..." : "Publish Campus Drive 🚀"}
            </button>
          </form>
        )}
      </div>

      {/* Candidate Pipeline */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            <span>👥</span> Candidate Pipeline
          </h2>
          {selectedApplicants.size > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-300 font-bold px-2">{selectedApplicants.size} Selected</span>
              <button onClick={() => handleBatchStatusUpdate('Shortlisted')} className="bg-purple-600 hover:bg-purple-500 text-xs px-3 py-1.5 rounded-lg font-bold">Shortlist</button>
              <button onClick={() => handleBatchStatusUpdate('Rejected')} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1.5 rounded-lg font-bold">Reject</button>
            </div>
          )}
        </div>
        
        {applications.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No candidate applications received yet.</p>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div key={app.id} className={`bg-slate-950 border p-5 rounded-xl space-y-4 transition-all ${selectedApplicants.has(app.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-800'}`}>
                
                {/* Header info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedApplicants.has(app.id)} onChange={() => toggleSelectApplicant(app.id)} className="mt-1.5 w-4 h-4 rounded border-slate-700 bg-slate-900 accent-blue-600" />
                    <div>
                      <h3 className="font-bold text-white text-lg">{app.profiles?.name || `Applicant ${app.student_id.substring(0, 8)}`}</h3>
                      <p className="text-xs text-slate-400 font-medium">CGPA: {app.profiles?.cgpa} | Branch: {app.profiles?.branch}</p>
                      <p className="text-xs text-emerald-400 font-medium mt-1">Applied for: {app.jobs?.title}</p>
                    </div>
                  </div>
                  
                  <select 
                    value={app.status} 
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2 focus:border-blue-500 outline-none"
                  >
                    <option value="applied">Applied (New)</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview Scheduled</option>
                    <option value="hired">Hired / Offer Extended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Secure Document Links */}
                <div className="flex flex-col md:flex-row gap-3 pt-3 border-t border-slate-800">
                  {app.profiles?.resume_url || app.resume_url ? (
                    <a href={app.profiles?.resume_url || app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-900 border border-slate-700 hover:border-indigo-500 text-indigo-400 px-4 py-2 rounded-lg transition-all text-center flex-1 font-bold">
                      📄 View Resume
                    </a>
                  ) : <p className="text-xs text-slate-500 italic flex-1 flex items-center justify-center">No resume attached</p>}
                </div>

                {/* Interview & Offer Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Schedule Interview</label>
                    <div className="flex gap-2">
                      <input 
                        type="datetime-local" 
                        onChange={(e) => setInterviewDates({...interviewDates, [app.id]: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none" 
                      />
                      <button onClick={() => scheduleInterview(app.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 rounded-lg transition-all">
                        Set
                      </button>
                    </div>
                    {app.interview_date && <p className="text-xs text-amber-400 mt-2 font-semibold">Scheduled: {new Date(app.interview_date).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Generate Final Offer</label>
                    <input 
                      type="text" 
                      placeholder="Offered Package (e.g. 12 LPA)" 
                      onChange={(e) => setOfferDetails({...offerDetails, [app.id]: {...offerDetails[app.id], offered_package: e.target.value}})}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        onChange={(e) => setOfferDetails({...offerDetails, [app.id]: {...offerDetails[app.id], joining_date: e.target.value}})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                      />
                      <input 
                        type="time" 
                        onChange={(e) => setOfferDetails({...offerDetails, [app.id]: {...offerDetails[app.id], reporting_time: e.target.value}})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Reporting Place" 
                        list="city-suggestions"
                        onChange={(e) => setOfferDetails({...offerDetails, [app.id]: {...offerDetails[app.id], reporting_place: e.target.value}})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-emerald-500 outline-none" 
                      />
                      <datalist id="city-suggestions">
                        <option value="Bangalore, Karnataka" />
                        <option value="Hyderabad, Telangana" />
                        <option value="Pune, Maharashtra" />
                        <option value="Chennai, Tamil Nadu" />
                        <option value="Noida, Uttar Pradesh" />
                        <option value="Gurugram, Haryana" />
                        <option value="Mumbai, Maharashtra" />
                        <option value="Kolkata, West Bengal" />
                        <option value="Trivandrum, Kerala" />
                        <option value="Bhubaneswar, Odisha" />
                        <option value="New Delhi, Delhi" />
                        <option value="Chandigarh, UT" />
                        <option value="Ahmedabad, Gujarat" />
                        <option value="Jaipur, Rajasthan" />
                        <option value="Lucknow, Uttar Pradesh" />
                        <option value="San Francisco, USA" />
                        <option value="Seattle, USA" />
                        <option value="New York, USA" />
                        <option value="London, UK" />
                        <option value="Dubai, UAE" />
                        <option value="Singapore" />
                        <option value="Toronto, Canada" />
                        <option value="Sydney, Australia" />
                        <option value="Tokyo, Japan" />
                        <option value="Dublin, Ireland" />
                      </datalist>
                      <button onClick={() => saveOfferDetails(app.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 rounded-lg transition-all">
                        Hire
                      </button>
                    </div>
                    {app.offered_package && <p className="text-xs text-emerald-400 mt-2 font-semibold">Offer sent: {app.offered_package}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
