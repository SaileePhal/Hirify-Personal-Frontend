import { getAccessToken } from './supabaseClient';
import { FlaskUser } from '../hooks/useAuth';

// BASE_URL is correctly set: http://127.0.0.1:5000/api/v1
const BASE_URL = 'http://127.0.0.1:5000/api/v1';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ✅ Interface that matches the Flask backend's job listing response
export interface BackendJobResponse {
  jobs: Job[]; // The key used by the backend is 'jobs'
  total: number;
  page: number;
  page_size: number;
}

// Interface for Saved Jobs endpoint response
export interface BackendSavedJobResponse {
  saved_jobs: SavedJob[]; // Matches the backend key
  total: number;
  page: number;
  page_size: number; 
}

// Interface for Applications endpoint response
export interface BackendApplicationResponse {
  applications: Application[]; // Matches the backend key
  total: number;
  page: number;
  page_size: number;
}

// Types
export interface Job {
  id: string;
  title: string;
  company: string; 
  company_name?: string; // 🔥 CRITICAL FIX: Add the backend's key for mapping flexibility
  location: string;
  salary_min?: number;
  salary_max?: number;
  job_type: string;
  experience_level: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  recruiter_id: string;
  recruiter?: {
    name: string;
    email: string;
    company: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  saved_at: string;
  // Use a more flexible type for the nested job object now that we rely on fetching full details for SavedJobs.tsx
  jobs: Partial<Job> & { company_name?: string; skills_required?: string[]; };
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_url: string;
  cover_letter?: string;
  // 🔥 CRITICAL FIX: Update the status type to match your SQL schema
  status: 'applied' | 'shortlisted' | 'rejected' | 'interview' | 'selected';
  applied_at: string;
  updated_at: string;
  job?: Job;
  candidate?: {
    id: string;
    name: string;
    email: string;
  };
}

// Interface for the response from /auth/protected
interface ProtectedResponse {
    message: string;
    user_id: string; // This is the Supabase UID (auth_uid)
    email: string;
}

// Helper function for API calls (Re-enabling token for protected routes)
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAccessToken(); // Re-enabled token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }), // Re-enabled token
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
// =============Auth ENDPOINTS =============

export async function apiLogin(email: string, password: string): Promise<ApiResponse<any>> {
  return apiCall<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(email: string, password: string, role: string, name: string): Promise<ApiResponse<any>> {
  return apiCall<any>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, role, name }),
  });
}
// ============ JOB ENDPOINTS ============

/**
 * Parses a salary range string (e.g., "10-12 LPA") and converts it 
 * to salary_min and salary_max numerical values.
 */
function parseSalaryRange(salaryRange: string | null): { salary_min?: number; salary_max?: number } {
  if (!salaryRange || typeof salaryRange !== 'string') {
    return {};
  }
  
  // Regex to find two numerical groups, even with spaces or non-numeric characters in between
  const match = salaryRange.match(/(\d+)\s*-\s*(\d+)/);
  
  if (match) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    
    // Assuming 10k scaling based on your previous note (10 * 10,000 = 100,000 for $100k display)
    return { salary_min: min * 10000, salary_max: max * 10000 }; 
  }
  
  // Handle single number salaries if needed (e.g., "10 LPA")
  const singleMatch = salaryRange.match(/(\d+)/);
  if (singleMatch) {
    const min = parseInt(singleMatch[1], 10);
    return { salary_min: min * 10000, salary_max: undefined };
  }
  
  return {};
}

function createSalaryRangeString(jobData: Partial<Job>): string | undefined {
    const min = jobData.salary_min;
    const max = jobData.salary_max;

    if (min === undefined && max === undefined) {
        return undefined;
    }
    // Check if both fields are truly empty or zero (assuming 0 is not a valid salary)
    // If the salary fields were optional, we would simply return undefined here.
    // Since the backend says 'salary_range is required', we must assume at least one non-zero value is needed.
    const hasValidMin = min !== undefined && min > 0; // True (8000 > 0)
    const hasValidMax = max !== undefined && max > 0;

    if (!hasValidMin && !hasValidMax) {
        // If neither is present or both are 0, return undefined. 
        // NOTE: If the backend requires this field, returning undefined here will fail.
        // We will stick to returning undefined, and instead rely on the form to enforce non-empty.
        return undefined;
    }
    // Scale down by 10000 to get the LPA number (e.g., 80000 -> 8)
    // Use Math.round to handle potential floating-point issues, though ideally inputs are clean.
    const minLPA = min !== undefined ? Math.round(min / 10000) : null; // Math.round(0.8) = 1
    const maxLPA = max !== undefined ? Math.round(max / 10000) : null;

    if (minLPA && maxLPA) {
        return `${minLPA}-${maxLPA} LPA`;
    }
    if (minLPA) {
        return `${minLPA} LPA`; // e.g., "8 LPA"
    }
    if (maxLPA) {
        return `Up to ${maxLPA} LPA`; // e.g., "Up to 12 LPA"
    }
    return undefined;
}

// ✅ UPDATE: Use the new BackendJobResponse interface for the return type and add mapping logic
export async function getJobs(page = 1, pageSize = 10, search = ''): Promise<ApiResponse<BackendJobResponse>> {
  // Build the query string, including the search parameter
  let endpoint = `/jobs/?page=${page}&page_size=${pageSize}`;
  if (search) {
    // Assuming your Flask backend accepts a 'q' parameter for search
    endpoint += `&q=${encodeURIComponent(search)}`;
  }
  
  const result = await apiCall<BackendJobResponse>(endpoint);

  if (result.error || !result.data) {
    return { data: null, error: result.error || "Failed to fetch jobs." };
  }
  
  // 🔥 CRITICAL MAPPING: Process each job to extract salary and ensure correct keys
  const processedJobs = result.data.jobs.map((rawJob: any) => {
    
    const flaskJob = rawJob as any; 
    
    // 1. Parse the salary range string
    const salaryData = parseSalaryRange(flaskJob.salary_range);
    
    // 2. Map Flask keys (salary_range, company_name, skills_required) to Frontend keys (Job interface)
    const frontendJob: Job = {
        ...flaskJob, // Keep all existing properties
        
        // --- Mapping Salary ---
        salary_min: salaryData.salary_min,
        salary_max: salaryData.salary_max,

        // --- Mapping Company and Requirements (for consistency) ---
        company: flaskJob.company_name || flaskJob.company || 'Company N/A', 
        requirements: flaskJob.skills_required || flaskJob.requirements, 
        
        // Ensure ID is present
        id: flaskJob.id,
    };
    
    return frontendJob;
  });

  // Return the processed jobs list, replacing the raw list
  return { 
    data: {
      ...result.data,
      jobs: processedJobs, // Return the mapped list
    }, 
    error: null 
  };
}


// 1. Define the wrapper interface for a single job response
export interface SingleJobResponse {
  job: any; // Use 'any' temporarily or define a more specific mapping type
}

// 2. Update the getJob function
export async function getJob(id: string): Promise<ApiResponse<Job>> {
  // Use the wrapper interface when calling the API
  const result = await apiCall<SingleJobResponse>(`/jobs/${id}`);

  if (result.error || !result.data?.job) {
    return { data: null, error: result.error || "Job data not found in response." };
  }

  // Manually map the data structure before returning
  const flaskJob = result.data.job;
  // 🔥 CRITICAL: Parse the salary string here
  const salaryData = parseSalaryRange(flaskJob.salary_range);

  // Map Flask keys (e.g., company_name, skills_required) to Frontend keys (e.g., company, requirements)
  const frontendJob: Job = {
    // Standard fields
    id: flaskJob.id,
    title: flaskJob.title,
    location: flaskJob.location,
    job_type: flaskJob.job_type,
    experience_level: flaskJob.experience_level,
    description: flaskJob.description,
    recruiter_id: flaskJob.recruiter_id,
    created_at: flaskJob.created_at,
    updated_at: flaskJob.updated_at,
    
    // Mapped fields
    company: flaskJob.company_name, // Map company_name -> company
    requirements: flaskJob.skills_required, // Map skills_required -> requirements
    
    // Optional/Nullable fields (INJECT mapped salary here)
    salary_min: salaryData.salary_min, 
    salary_max: salaryData.salary_max,
    benefits: undefined,
  };

  return { data: frontendJob, error: null };
}


// ----------------------------------------------------
// 🔥 MODIFIED CREATE JOB FUNCTION (WRITES TO BACKEND)
// ----------------------------------------------------

export async function createJob(jobData: Partial<Job>): Promise<ApiResponse<Job>> {
  // We must transform the frontend's separate fields (min/max, requirements) 
  // into the backend's required format (salary_range, skills_required).
  const salaryRange = createSalaryRangeString(jobData);
  // 🛑 FIX: Enforce required field check on the client-side API layer
  if (!salaryRange) {
      return { 
          data: null, 
          error: "Salary range (Min or Max Salary) is required. Please enter at least one value." 
      };
  }
  const transformedData: any = {
      ...jobData,
      // 1. Convert salary_min/max back to salary_range string
      salary_range: salaryRange,

      // 2. Map frontend requirements array back to backend skills_required array
      skills_required: jobData.requirements,
      
      // 3. Ensure the backend uses company_name (from the frontend's 'company' field)
      company_name: jobData.company,

      // 4. Explicitly remove frontend-only/unwanted properties from the body
      salary_min: undefined, // Remove to avoid confusing the Flask endpoint
      salary_max: undefined,
      requirements: undefined,
      company: undefined,
  };
  
  // Clean up undefined properties for the request body
  // Note: JSON.stringify will automatically omit undefined values if they are the value of a key.
  // We explicitly create the body from the transformed object.
  const body = JSON.stringify(transformedData);
  return apiCall<Job>('/jobs/create', {
    method: 'POST',
    body: body,
  });
}


// ----------------------------------------------------
// 🔥 MODIFIED UPDATE JOB FUNCTION (WRITES TO BACKEND)
// ----------------------------------------------------

export async function updateJob(id: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> {
  // We must transform the frontend's separate fields (min/max, requirements) 
  // into the backend's required format (salary_range, skills_required) for the update.
  
  // Create a base object with only the properties that were actually modified/sent.
  const updatePayload: Partial<Job> = {};

  // Get the salary range string
  const salaryRange = createSalaryRangeString(jobData);
  
  // 🛑 FIX: Enforce required field check on the client-side API layer for updates as well
  if (!salaryRange) {
      return { 
          data: null, 
          error: "Salary range (Min or Max Salary) is required. Please ensure you enter a value." 
      };
  }

  // Copy non-salary properties
  for (const key in jobData) {
      if (key !== 'salary_min' && key !== 'salary_max') {
          (updatePayload as any)[key] = (jobData as any)[key];
      }
  }

  // Handle Salary conversion only if min or max were provided in the update payload
  if (jobData.salary_min !== undefined || jobData.salary_max !== undefined) {
      // The helper handles converting min/max back to the required string
      (updatePayload as any)['salary_range'] = createSalaryRangeString(jobData);
  }
  
  // Handle Requirements and Company Name mapping for update
  if (jobData.requirements !== undefined) {
      (updatePayload as any)['skills_required'] = jobData.requirements;
  }
  if (jobData.company !== undefined) {
      (updatePayload as any)['company_name'] = jobData.company;
  }
  
  // Remove the frontend-only keys if they somehow made it through
  delete updatePayload.salary_min;
  delete updatePayload.salary_max;
  delete updatePayload.requirements;
  delete updatePayload.company;

  const body = JSON.stringify(updatePayload);

  return apiCall<Job>(`/jobs/${id}`, {
    method: 'PUT',
    body: body,
  });
}

export async function deleteJob(id: string): Promise<ApiResponse<void>> {
  return apiCall<void>(`/jobs/${id}`, {
    method: 'DELETE',
  });
}

export async function getRecruiterJobs(page = 1, pageSize = 10): Promise<ApiResponse<BackendJobResponse>> {
  // ✅ CHANGE: Use the new BackendJobResponse interface for the return type
  return apiCall<BackendJobResponse>(`/jobs/my-jobs?page=${page}&page_size=${pageSize}`);
}


// ============ SAVED JOBS ENDPOINTS ============ 

export async function saveJob(jobId: string): Promise<ApiResponse<SavedJob>> {
  return apiCall<SavedJob>('/user-jobs/saved-jobs', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function getSavedJobs(page = 1, pageSize = 10): Promise<ApiResponse<BackendSavedJobResponse>> {
  return apiCall<BackendSavedJobResponse>(`/user-jobs/saved-jobs?page=${page}&page_size=${pageSize}`);
}

export async function removeSavedJob(id: string): Promise<ApiResponse<void>> {
  return apiCall<void>(`/user-jobs/saved-jobs/${id}`, {
    method: 'DELETE',
  });
}

// ============ APPLICATION ENDPOINTS ============ 

export async function applyJob(
  jobId: string,
  resumeUrl: string,
  coverLetter?: string
): Promise<ApiResponse<Application>> {
  return apiCall<Application>('/user-jobs/applications', {
    method: 'POST',
    body: JSON.stringify({
      job_id: jobId,
      resume_url: resumeUrl,
      cover_letter: coverLetter,
    }),
  });
}

export async function getMyApplications(
  page = 1,
  pageSize = 10
): Promise<ApiResponse<BackendApplicationResponse>> {
  return apiCall<BackendApplicationResponse>(`/user-jobs/applications?page=${page}&page_size=${pageSize}`);
}

export async function updateApplication(
  id: string,
  data: { resume_url?: string; cover_letter?: string }
): Promise<ApiResponse<Application>> {
  return apiCall<Application>(`/user-jobs/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function withdrawApplication(id: string): Promise<ApiResponse<void>> {
  return apiCall<void>(`/user-jobs/applications/${id}`, {
    method: 'DELETE',
  });
}


// Helper function to check for a single application status
export async function getJobApplicationStatus(jobId: string): Promise<ApiResponse<{ status: string } | null>> {
  // NOTE: Your backend only has GET /applications (list) or GET /applications/recruiter.
  // We will call the candidate's list endpoint and rely on the list to contain the status.
  
  const result = await getMyApplications(1, 500); // Fetch a reasonable number of recent applications

  if (result.error) {
    return { data: null, error: result.error };
  }

  // Find the application for the specific job ID
  const application = result.data?.applications.find(
    (app) => app.job_id === jobId
  );

  if (application) {
    // Return the status if found
    return { data: { status: application.status }, error: null };
  }

  // Return null data if not applied
  return { data: null, error: null };
}

// ============ RECRUITER APPLICATION ENDPOINTS ============

// export async function getRecruiterApplications(
//   page = 1,
//   pageSize = 10,
// ): Promise<ApiResponse<BackendApplicationResponse>> {
//   return apiCall<BackendApplicationResponse>(
//     `/user-jobs/applications/recruiter?page=${page}&page_size=${pageSize}` 
//   );
// }

export async function getRecruiterApplications(
  page = 1,
  pageSize = 10,
  // 🔥 MODIFICATION 1: Accept an optional jobId parameter
  jobId?: string 
): Promise<ApiResponse<BackendApplicationResponse>> {
  
  let endpoint = `/user-jobs/applications/recruiter?page=${page}&page_size=${pageSize}`;
  
  // 🔥 MODIFICATION 2: Append jobId to the endpoint if provided
  if (jobId) {
    endpoint += `&job_id=${jobId}`;
  }

  return apiCall<BackendApplicationResponse>(endpoint);
}

export async function updateApplicationStatus(
  id: string,
  status: 'shortlisted' | 'rejected' | 'interview' | 'selected'
): Promise<ApiResponse<Application>> {
  return apiCall<Application>(`/user-jobs/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ============ PROFILE ENDPOINT ============

export async function getMyProfile(): Promise<ApiResponse<FlaskUser>> {
    // 1. Validate the token and get the auth_uid/email from the protected route
    const tokenValidationResult = await apiCall<ProtectedResponse>('/auth/protected');
    
    if (tokenValidationResult.error || !tokenValidationResult.data) {
        // If token validation fails, return the error
        return { data: null, error: tokenValidationResult.error || "Token validation failed." };
    }

    const { user_id: auth_uid, email } = tokenValidationResult.data;
    
    // 2. Fetch the full profile from the database using the user_id (auth_uid)
    const profileResult = await apiCall<Omit<FlaskUser, 'email'>>(`/auth/profile/${auth_uid}`);

    if (profileResult.error || !profileResult.data) {
        return { data: null, error: profileResult.error || "Failed to fetch user profile data." };
    }
    
    // 3. Combine and cast the data
    const profileData = profileResult.data;

    const fullUser: FlaskUser = {
        // Ensure that the profile endpoint returns the correct fields (id, first_name, last_name, role)
        id: profileData.id, 
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: profileData.role,
        email: email, // Add the email from the protected route
    };

    return { data: fullUser as FlaskUser, error: null };
}

