import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ApplicationCard } from '@/components/ApplicationCard';
import { Pagination } from '@/components/Pagination';
import { LoadingCard } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { 
  getRecruiterApplications, 
  updateApplicationStatus, 
  Application 
} from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
// 🔥 ADD: Import useParams to read the job ID from the URL
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // 🔥 Add this import if not there

export default function RecruiterApplications() {
  useRequireAuth('recruiter');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // 🔥 ADD: Get the jobId from the route parameters
  // Assuming your route is /recruiter/applications/:jobId. It can be undefined if you hit /recruiter/applications directly.
  const { jobId } = useParams<{ jobId: string }>();
  const { role, loading: authLoading } = useAuth(); // 🔥 Get auth state

  // --- New Helper Variables for Empty State ---
  // Check if the user is currently viewing a specific job's applicants
  const isFilteredByJob = !!jobId;

  const emptyStateTitle = isFilteredByJob
    ? 'No Applicants Yet' // Title when filtering by a job
    : 'No Applications Received'; // Title when viewing all applications

  const emptyStateDescription = isFilteredByJob
    ? 'This specific job listing has not yet received any applications.' // Description when filtering
    : 'You have not yet received any applications for any of your job listings.'; // Description when viewing all


  const fetchApplications = async () => {
    // 🛑 STOP: If auth is still loading or user isn't a recruiter, don't call the API
    if (authLoading || role !== 'recruiter') {
      return;
    }
    setLoading(true);
    setError(null);
    
    const { data, error } = await getRecruiterApplications(page, 10, jobId);
    
    if (error) {
      setError(error);
    } else if (data) {
      setApplications(data.applications);
      setTotalPages(Math.ceil(data.total / data.page_size));
    }
    
    setLoading(false);
  };

  // useEffect(() => {
  //   fetchApplications();
  // }, [page, jobId]);
  useEffect(() => {
    // 🔥 Only fetch if auth is finished and we know the user is a recruiter
    if (!authLoading && role === 'recruiter') {
      fetchApplications();
    }
  }, [page, jobId, role, authLoading]); // 🔥 Add role and authLoading to dependencies

  // 🔥 FIX 1: Narrow the type parameter to match the recruiter actions.
  // We assume the API accepts 'shortlisted', 'rejected', 'interview', 'selected' 
  // based on your ApplicationCard buttons. If 'under-review' is required by API, 
  // you must use that instead of 'shortlisted' here.

  const handleStatusChange = async (id: string, status: 'shortlisted' | 'rejected' | 'interview' | 'selected') => {
    const { error } = await updateApplicationStatus(id, status);
    
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Status updated',
        description: `Application has been marked as ${status.replace('-', ' ')}`,
      });
      fetchApplications();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {/* You can also update the main heading here */}
            {isFilteredByJob ? 'Applicants for Job ID: ' + jobId : 'All Applications'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Review and manage applications for your job listings
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={fetchApplications} />
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          // 🔥 CRITICAL FIX: Use the new contextual variables
          <EmptyState
            icon={FileText}
            title={emptyStateTitle} // Use contextual title
            description={emptyStateDescription} // Use contextual description
            actionLabel="Go to Dashboard"
            actionHref="/recruiter/dashboard"
          />
        ) : (
          <>
            <div className="space-y-4">
              {applications.map((application, index) => (
                <div
                  key={application.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ApplicationCard
                    application={application}
                    isRecruiter={true}
                    // 🔥 FIX 2: Add the required 'canEdit' prop
                    canEdit={false}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
