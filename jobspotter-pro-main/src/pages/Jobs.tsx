import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { JobCard } from '@/components/JobCard';
import { Pagination } from '@/components/Pagination';
import { ApplyModal } from '@/components/ApplyModal';
import { LoadingCard, LoadingState } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
// NOTE: getJobs now returns BackendJobResponse structure
import { getJobs, saveJob, getSavedJobs, applyJob, Job, SavedJob } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Briefcase, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Jobs() {
  const { user, isCandidate } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Apply modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
// 🔥 FIX 1: Pass searchQuery to the API function
    const { data, error } = await getJobs(page, 9, searchQuery);
    
    if (error) {
      setError(error);
    } else if (data) {
      // 🔥 FIX: The data payload is stored in the 'jobs' property from the backend
      setJobs(data.jobs); 
      setTotalPages(Math.ceil(data.total / data.page_size));
    }
    
    setLoading(false);
  };

  const fetchSavedJobs = async () => {
    if (!user || !isCandidate) return;
    
    const { data } = await getSavedJobs(1, 100);
    if (data) {
      // NOTE: This assumes getSavedJobs still returns data.data (PaginatedResponse)
      setSavedJobs(data.saved_jobs);
    }
  };

 // 2. 🔥 FIX 2: Trigger fetchJobs when searchQuery changes, and reset page to 1
useEffect(() => {
    fetchJobs();
    fetchSavedJobs();
}, [page, user, searchQuery]); // Add searchQuery as a dependency

  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save jobs',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await saveJob(jobId);
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job saved',
        description: 'Job has been added to your saved list',
      });
      fetchSavedJobs();
    }
  };

  const handleApply = (job: Job) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to apply for jobs',
        variant: 'destructive',
      });
      return;
    }
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

  const isJobSaved = (jobId: string) => {
    if (!savedJobs || !Array.isArray(savedJobs)) {
        return false;
    }
    return savedJobs.some(saved => saved.job_id === jobId);
  };

  // const filteredJobs = jobs.filter(job => 
  //   job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   job.location.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Find Your Next Opportunity
          </h1>
          <p className="mt-2 text-muted-foreground">
            Browse through thousands of job listings from top companies
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by title, company, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 text-base"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={fetchJobs} />
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={searchQuery 
              ? "Try adjusting your search terms" 
              : "There are no job listings available at the moment"}
          />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <JobCard
                    job={job}
                    isSaved={isJobSaved(job.id)}
                    onSave={isCandidate ? handleSaveJob : undefined}
                    onApply={isCandidate ? handleApply : undefined}
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