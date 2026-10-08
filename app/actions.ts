"use server";

import { supabase } from "../lib/supabase";

export async function submitApplication(jobId: string, studentId: string) {
  // 1. Fetch Student Profile
  const { data: student, error: studentError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return { success: false, error: "Student profile not found. Please update your profile first." };
  }

  // 2. Fetch Job Details
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return { success: false, error: "Job not found." };
  }

  // 3. Server-Side Eligibility Gating: CGPA
  if (job.min_cgpa && student.cgpa < job.min_cgpa) {
    return { 
      success: false, 
      error: `Ineligible: Your CGPA (${student.cgpa}) is below the required minimum (${job.min_cgpa}).` 
    };
  }

  // 4. Server-Side Eligibility Gating: Branch/Department
  if (job.allowed_departments && job.allowed_departments.length > 0) {
    const studentBranch = (student.branch || "").toLowerCase().trim();
    const allowed = job.allowed_departments.map((d: string) => d.toLowerCase().trim());
    
    if (!allowed.includes(studentBranch) && !allowed.includes('any')) {
      return {
        success: false,
        error: `Ineligible: Your branch (${student.branch}) is not eligible for this drive.`
      };
    }
  }

  // 5. Submit Application
  const { error: insertError } = await supabase.from("applications").insert({
    job_id: jobId,
    student_id: studentId,
    status: "applied",
  });

  if (insertError) {
    // Unique constraint error if already applied
    if (insertError.code === '23505') {
      return { success: false, error: "You have already applied to this job." };
    }
    return { success: false, error: "Failed to submit application: " + insertError.message };
  }

  return { success: true };
}

export async function logAdminAction(reviewerId: string, action: string, targetType: string, targetId: string, details: any = {}) {
  await supabase.from("audit_logs").insert({
    reviewer_id: reviewerId,
    action,
    target_type: targetType,
    target_id: targetId,
    details
  });
}
