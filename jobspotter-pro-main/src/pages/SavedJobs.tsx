import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { ApplyModal } from '@/components/ApplyModal';
import { LoadingCard } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
// 🔥 FIX: Import getJob here
import { getSavedJobs, removeSavedJob, applyJob, SavedJob, Job, getJob } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Bookmark } from 'lucide-react';


export default function SavedJobs() {
  useRequireAuth('candidate');
  
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Apply modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSavedJobs = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await getSavedJobs(page, 10);
    
    if (error) {
        setError(error);
        setLoading(false);
        return;
    }
    
    if (data && data.saved_jobs.length > 0) {
        // 🔥 CRITICAL FIX: Fetch full job details for each saved job entry
        const fetchDetailsPromises = data.saved_jobs.map(async (savedJob) => {
            // Get the ID from the saved job record
            const jobId = savedJob.job_id;
            
            // Call the getJob function (which returns the full Job object)
            const jobResult = await getJob(jobId);

            if (jobResult.data) {
                // If job details are successfully fetched, replace the partial 'jobs' object 
                // with the full Job object data, but preserve the savedJob's metadata (id, saved_at).
                return {
                    ...savedJob,
                    // The returned jobResult.data is a complete Job, 
                    // which overwrites the incomplete `savedJob.jobs`.
                    jobs: { ...jobResult.data, id: jobId } as Job, 
                };
            }
            // If fetching fails, return the original incomplete savedJob
            return savedJob;
        });

        // Wait for all detail fetches to complete
        const savedJobsWithDetails = await Promise.all(fetchDetailsPromises);

        setSavedJobs(savedJobsWithDetails);
        setTotalPages(Math.ceil(data.total / data.page_size));
    } else {
        setSavedJobs([]);
        setTotalPages(0);
    }
    
    setLoading(false);
};

  useEffect(() => {
    fetchSavedJobs();
  }, [page]);

  const handleRemoveSaved = async (savedJobId: string) => {
    const { error } = await removeSavedJob(savedJobId);
    
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job removed',
        description: 'Job has been removed from your saved list',
      });
      fetchSavedJobs();
    }
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setApplyModalOpen(true);
  };

  const handleSubmitApplication = async (resumeUrl: string, coverLetter?: string) => {
    if (!selectedJob) return;
    
    setIsSubmitting(true);
    const { error } = await applyJob(selectedJob.id, resumeUrl, coverLetter);
    setIsSubmitting(false);
    
    if (error) {
      throw new Error(error);
    }
    
    toast({
      title: 'Application submitted',
      description: 'Your application has been sent successfully',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Saved Jobs
          </h1>
          <p className="mt-2 text-muted-foreground">
            Jobs you've saved for later
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={fetchSavedJobs} />
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No saved jobs"
            description="Save jobs you're interested in to view them here later"
            actionLabel="Browse Jobs"
            actionHref="/jobs"
          />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((savedJob, index) => {
                
                const jobForCard = savedJob.jobs; // 🔥 SIMPLIFICATION: We assume 'jobs' now contains the full data
                
                if (!jobForCard) {
                  // This should rarely happen now that we fetch the details
                  console.warn(`Skipping saved job ID ${savedJob.id}: Linked job data is missing.`);
                  return null;
                }
                
                // We need to ensure the JobCard receives a clean Job object.
                // Since we fetched the full data, we cast and rely on it.
                const job = jobForCard as Job; 

                return (
                  <div
                    key={savedJob.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <JobCard
                      // Pass the full job object
                      job={job} 
                      isSaved={true}
                      onUnsave={() => handleRemoveSaved(savedJob.id)}
                      onApply={handleApply}
                      savedJobId={savedJob.id}
                    />
                  </div>
                );
              })} 
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

      <ApplyModal
        job={selectedJob}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}