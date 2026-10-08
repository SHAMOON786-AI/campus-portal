"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role?.toLowerCase() || "student";
      
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "recruiter") {
        router.push("/recruiter");
      } else {
        router.push("/dashboard");
      }
    };

    checkUserRole();
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-semibold tracking-wide">Authenticating & routing to your portal...</p>
      </div>
    </main>
  );
}