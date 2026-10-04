"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Check your email for the confirmation link!");
  };

  const handleSignIn = async () => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      setMessage(authError.message);
      return;
    }

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        setMessage("Error fetching user profile.");
        return;
      }

      // We added this popup to see exactly what the database is returning!
      

      if (profileData.role === "admin") {
        router.push("/admin");
      } else if (profileData.role === "recruiter") {
        router.push("/recruiter");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black">
      <div className="w-full max-w-sm p-8 bg-gray-900 rounded-lg shadow-md border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Campus Portal Login</h1>
        
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 text-white rounded border border-gray-700"
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-gray-800 text-white rounded border border-gray-700"
        />
        
        <div className="flex gap-4">
          <button 
            onClick={handleSignIn} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={handleSignUp} 
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold p-3 rounded transition-colors"
          >
            Sign Up
          </button>
        </div>

        {message && <p className="mt-4 text-center text-sm text-yellow-400">{message}</p>}
      </div>
    </main>
  );
}