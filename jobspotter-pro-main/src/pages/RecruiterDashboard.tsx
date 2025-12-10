import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Pagination } from '@/components/Pagination';
import { LoadingCard } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { getJobs, deleteJob, Job } from '@/lib/api';
import { getRecruiterJobs, deleteJob, Job } from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Briefcase, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  DollarSign,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel, 
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { JobFormModal } from '@/components/JobFormModal';

export default function RecruiterDashboard() {
  useRequireAuth('recruiter');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Job form modal
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await getRecruiterJobs(page, 10);
    
    if (error) {
      setError(error);
    } else if (data) {
      setJobs(data.jobs);
      setTotalPages(Math.ceil(data.total / data.page_size));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    const { error } = await deleteJob(deleteId);
    
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Job deleted',
        description: 'The job listing has been deleted',
      });
      fetchJobs();
    }
    
    setDeleteId(null);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setJobFormOpen(true);
  };

  const handleCreate = () => {
    setEditingJob(null);
    setJobFormOpen(true);
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Recruiter Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your job listings and view applications
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onRetry={fetchJobs} />
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No job listings"
            description="You haven't posted any jobs yet. Start by creating your first job listing."
            actionLabel="Post New Job"
            onAction={handleCreate}
          />
        ) : (
          <>
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  className="animate-fade-in rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{job.job_type}</Badge>
                        <Badge variant="outline">{job.experience_level}</Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-foreground">
                        {job.title}
                      </h3>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        {formatSalary(job.salary_min, job.salary_max) && (
                          <span className="flex items-center gap-1 text-success">
                            {/* <DollarSign className="h-4 w-4" /> */}
                            {formatSalary(job.salary_min, job.salary_max)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {/* 🔥 CRITICAL FIX: Update Link to include the job.id in the URL */}
                    <Link to={`/recruiter/applications/${job.id}`}>.  {/* 🔥 FIX: Include job ID in the applications link . <Link to={`/recruiter/applications/${job.id}`}>
*/}
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4" />
                        View Applications
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setDeleteId(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
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

      <JobFormModal
        job={editingJob}
        isOpen={jobFormOpen}
        onClose={() => {
          setJobFormOpen(false);
          setEditingJob(null);
        }}
        onSuccess={() => {
          fetchJobs();
          setJobFormOpen(false);
          setEditingJob(null);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this job listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
