import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ApplyModal } from '@/components/ApplyModal';
import { LoadingState } from '@/components/LoadingState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { getJob, saveJob, applyJob, Job } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Bookmark,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApplicationStatus } from '@/hooks/use-application-status';

// Helper component for the Application Status Bar
const ApplicationStatusAlert: React.FC<{ status: string }> = ({ status }) => {
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1);
    
    let icon = AlertCircle;
    let variant: 'default' | 'destructive' = 'default';
    let colorClass = 'text-primary';

    switch (status) {
        case 'selected':
            icon = CheckCircle2;
            colorClass = 'text-green-600';
            break;
        case 'rejected':
            icon = AlertCircle;
            variant = 'destructive';
            colorClass = 'text-red-600';
            break;
        default:
            icon = Clock;
            colorClass = 'text-yellow-600';
            break;
    }

    const IconComponent = icon;

    return (
        <Alert className="mb-4 border-2 p-4" variant={variant}>
            <IconComponent className={`h-4 w-4 ${colorClass}`} />
            <AlertTitle className="text-base font-semibold">Application Status</AlertTitle>
            <AlertDescription className="text-sm">
                You have **already applied** for this job. Your current status is: <strong className={colorClass}>{formattedStatus}</strong>.
            </AlertDescription>
        </Alert>
    );
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, isCandidate } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔥 Use hook for application status
  const { status, isApplied, isLoading, error: statusError, refetch: refetchStatus } = useApplicationStatus(id);

  const fetchJob = async () => {
    if (!id) {
        setError("Job ID is missing.");
        setLoading(false);
        return;
    }
    
    setLoading(true);
    setError(null);
    
    // The getJob function now returns the clean Job object directly (or null/error)
    const { data, error } = await getJob(id); 
    
    if (error) {
      setError(error);
    } else if (data) { // Ensure data exists before setting
      setJob(data);
    } else {
      // Handles case where error is null but data is null (e.g., 404 handled by API wrapper)
      setError("Job not found.");
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJob();
    // Since we use the refetch function from the hook, we don't need to manually call it here
  }, [id]);

  const handleSaveJob = async () => {
    if (!job) return;
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save jobs',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await saveJob(job.id);
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
    }
  };
  
  // 🔥 Update handleSubmitApplication to refetch status
  const handleSubmitApplication = async (resumeUrl: string, coverLetter?: string) => {
    if (!job) return;
    
    setIsSubmitting(true);
    const { error } = await applyJob(job.id, resumeUrl, coverLetter);
    setIsSubmitting(false);
    
    if (error) {
      throw new Error(error);
    }
    
    toast({
      title: 'Application submitted',
      description: 'Your application has been sent successfully',
    });
    
    setApplyModalOpen(false);
    // 🔥 CRITICAL: Refresh the application status after successful application
    // We use refetch provided by the custom hook.
    // If the hook doesn't provide refetch, setting the page state to trigger a re-render is an alternative.
    // Assuming useApplicationStatus has a refetch capability or state changes trigger a re-run.
    refetchStatus(); 
  };
  
  const handleApplyClick = () => {
    if (!job) return;

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to apply for jobs',
        variant: 'destructive',
      });
      return;
    }
    
    if (isLoading) {
        return;
    }
    
    if (isApplied) {
        // Show toast if already applied
        toast({
            title: 'Already Applied',
            description: `You have already applied for this job. Current status: ${status.charAt(0).toUpperCase() + status.slice(1)}.`,
            variant: 'default',
        });
        return;
    }
    
    setApplyModalOpen(true);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.company}`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Job link has been copied to clipboard',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <Link 
          to="/jobs" 
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={fetchJob} />
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading job details..." />
        ) : job ? (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-8 shadow-card">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{job.job_type}</Badge>
                  <Badge variant="outline">{job.experience_level}</Badge>
                </div>

                <h1 className="font-display text-3xl font-bold text-foreground">
                  {job.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {job.location}
                  </span>
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <span className="flex items-center gap-2 text-success">
                      {/* <DollarSign className="h-5 w-5" /> */}
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </div>

                <div className="mt-8 border-t border-border pt-8">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    About this role
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {job.description}
                  </p>
                </div>

                {job.requirements && job.requirements.length > 0 && (
                  <div className="mt-8 border-t border-border pt-8">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Requirements
                    </h2>
                    <ul className="mt-4 space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {job.benefits && job.benefits.length > 0 && (
                  <div className="mt-8 border-t border-border pt-8">
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Benefits
                    </h2>
                    <ul className="mt-4 space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-muted-foreground">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-6 shadow-card">
                
                {/* 🔥 Status Alert Display */}
                {isCandidate && isApplied && status !== 'loading' && (
                    <ApplicationStatusAlert status={status} />
                )}
                
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Interested in this job?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Apply now and take the next step in your career.
                </p>

                <div className="mt-6 space-y-3">
                  {isCandidate && (
                    <Button 
                      onClick={handleApplyClick}
                      className="w-full" 
                      size="lg"
                      // 🔥 CRITICAL: Update disabled state and variant based on status
                      disabled={isLoading || isApplied}
                      variant={isApplied ? 'secondary' : 'default'}
                    >
                      {isLoading 
                        ? 'Checking Status...'
                        : isApplied
                            ? `Applied (${status.charAt(0).toUpperCase() + status.slice(1)})`
                            : 'Apply Now'
                      }
                    </Button>
                  )}
                  
                  {isCandidate && (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="lg"
                      onClick={handleSaveJob}
                    >
                      <Bookmark className="h-4 w-4" />
                      Save Job
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    size="lg"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>

                {job.recruiter && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h4 className="text-sm font-medium text-foreground">
                      Posted by
                    </h4>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
                        {job.recruiter.name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {job.recruiter.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.recruiter.company}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Job not found</p>
          </div>
        )}
      </main>

      <ApplyModal
        job={job}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}