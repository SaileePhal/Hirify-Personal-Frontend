import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ApplicationCard } from '@/components/ApplicationCard';
import { EditApplicationModal } from '@/components/EditApplicationModal';
import { Pagination } from '@/components/Pagination';
import { LoadingCard } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { 
  getMyApplications, 
  updateApplication, 
  withdrawApplication, 
  Application 
} from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
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

// Define non-editable statuses based on your SQL schema:
// applied is the only editable status.
const NON_EDITABLE_STATUSES = ['shortlisted', 'rejected', 'interview', 'selected'];

export default function Applications() {
  useRequireAuth('candidate');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit modal
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Withdraw confirmation
  const [withdrawId, setWithdrawId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    
    // NOTE: If you were fetching jobs, the search query would be passed here.
    const { data, error } = await getMyApplications(page, 10);
    
    if (error) {
      setError(error);
    } else if (data) {
      setApplications(data.applications || []);
      setTotalPages(Math.ceil(data.total / data.page_size));
    }else {
        // Handle case where no error but data is null
        setApplications([]);
        setTotalPages(0);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [page]);

  // 🔥 CRITICAL CHANGE: Check status before allowing edit
  const handleEdit = (application: Application) => {
    if (NON_EDITABLE_STATUSES.includes(application.status)) {
      toast({
        title: 'Edit Not Allowed',
        description: `You can only edit an application when its status is 'applied'. Current status: ${application.status.charAt(0).toUpperCase() + application.status.slice(1)}.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Proceed with editing only if status is 'applied'
    setSelectedApplication(application);
    setEditModalOpen(true);
  };

  const handleUpdateApplication = async (resumeUrl: string, coverLetter?: string) => {
    if (!selectedApplication) return;
    
    setIsSubmitting(true);
    const { error } = await updateApplication(selectedApplication.id, {
      resume_url: resumeUrl,
      cover_letter: coverLetter,
    });
    setIsSubmitting(false);
    
    if (error) {
      throw new Error(error);
    }
    
    toast({
      title: 'Application updated',
      description: 'Your application has been updated successfully',
    });
    // Close modal and refresh list
    setEditModalOpen(false);
    fetchApplications();
  };

  const handleWithdraw = async () => {
    if (!withdrawId) return;
    
    // Optional: Check status before withdrawing if you want to prevent withdrawing 'selected' or 'interview'
    // For now, we allow withdrawal for any status as per the original requirement.
    
    const { error } = await withdrawApplication(withdrawId);
    
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Application withdrawn',
        description: 'Your application has been withdrawn',
      });
      fetchApplications();
    }
    
    setWithdrawId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">
            My Applications
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track the status of your job applications
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
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="You haven't applied to any jobs yet. Start exploring opportunities!"
            actionLabel="Browse Jobs"
            actionHref="/jobs"
          />
        ) : (
          <>
            <div className="space-y-4">
              {applications.map((application, index) => {
                // Determine if edit button should be shown on the card
                const isEditable = application.status === 'applied';
                
                return (
                  <div
                    key={application.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ApplicationCard
                      application={application}
                      // Pass a flag to ApplicationCard to control button visibility
                      canEdit={isEditable} 
                      // Pass the handler, which will perform the check again
                      onEdit={handleEdit} 
                      onWithdraw={(id) => setWithdrawId(id)}
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

      <EditApplicationModal
        application={selectedApplication}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleUpdateApplication}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!withdrawId} onOpenChange={() => setWithdrawId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}