"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("name, branch, cgpa")
      .eq("id", user.id)
      .single();

    if (data) {
      setName(data.name || "");
      setBranch(data.branch || "");
      setCgpa(data.cgpa ? data.cgpa.toString() : "");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name, branch, cgpa: parseFloat(cgpa) })
      .eq("id", user.id);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      router.push("/dashboard"); // Sends student back to dashboard after saving
    }
  };

  if (loading) return <div className="p-12 bg-black text-white min-h-screen">Loading profile...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-black text-white">
      <div className="w-full max-w-xl p-8 bg-gray-900 rounded-lg border border-gray-800">
        
        <h1 className="text-3xl font-bold mb-6">Complete Your Profile</h1>
        <p className="text-gray-400 mb-8">Update your details so recruiters can review your application.</p>
        
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Full Name</label>
            <input 
              type="text" placeholder="e.g. Harish Jayaraj" required
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Branch / Specialization</label>
            <input 
              type="text" placeholder="e.g. Computer Science and Engineering" required
              value={branch} onChange={(e) => setBranch(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Current CGPA</label>
            <input 
              type="number" step="0.1" max="10" placeholder="e.g. 8.5" required
              value={cgpa} onChange={(e) => setCgpa(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded mt-4 transition-colors">
            Save Profile
          </button>
        </form>

      </div>
    </main>
  );
}