import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Job } from '@/lib/api';
import { 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
// Import the hook and toast
import { useApplicationStatus } from '@/hooks/use-application-status'; 
import { toast } from '@/hooks/use-toast';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
  onApply?: (job: Job) => void;
  showActions?: boolean;
  savedJobId?: string;
}

export function JobCard({ 
  job, 
  isSaved = false, 
  onSave, 
  onUnsave, 
  onApply,
  showActions = true,
  savedJobId 
}: JobCardProps) {

  // Use the new hook to check application status
  const { status, isApplied, isLoading } = useApplicationStatus(job.id);
  
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  // New handler for the Apply button click
  const handleApplyClick = () => {
    if (!onApply) return;

    if (isLoading) {
      // Ignore click if status is still loading
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
    
    // Only open the modal if not applied
    onApply(job);
  };


  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{job.job_type}</Badge>
            <Badge variant="outline">{job.experience_level}</Badge>
          </div>
          
          <Link to={`/jobs/${job.id}`} className="group/link">
            <h3 className="mb-1 text-lg font-semibold text-foreground transition-colors group-hover/link:text-primary line-clamp-1">
              {job.title}
            </h3>
          </Link>
          
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {job.company || job.company_name} 
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            {salary && (
              <span className="flex items-center gap-1 text-success">
                {/* <DollarSign className="h-4 w-4" /> */}
                {salary}
              </span>
            )}
          </div>

          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Posted {(() => {
              const dateString = job.created_at;
              
              // 1. Basic check for existence
              if (!dateString) return 'Date unavailable';

              // 2. Parse the date using date-fns
              const date = parseISO(dateString);
              
              // 3. Check if the resulting date is valid (NaN test is standard for invalid dates)
              if (isNaN(date.getTime())) {
                return 'Date unavailable';
              }

              // 4. If valid, format and display
              return formatDistanceToNow(date, { addSuffix: true });
            })()}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
          <Link to={`/jobs/${job.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <ExternalLink className="h-4 w-4" />
              View Details
            </Button>
          </Link>
          
          {onApply && (
            // Apply Button logic
            <Button 
                onClick={handleApplyClick} 
                size="sm" 
                className="flex-1"
                // 🔥 CRITICAL: Disable while loading status
                disabled={isLoading}
                // 🔥 CRITICAL: Change variant/text if applied
                variant={isApplied ? 'secondary' : 'default'}
            >
                {isLoading 
                    ? 'Checking Status...' 
                    : isApplied 
                        ? `Applied (${status.charAt(0).toUpperCase() + status.slice(1)})` 
                        : 'Apply Now'}
            </Button>
          )}

          {(onSave || onUnsave) && (
            <Button
              variant={isSaved ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => {
                if (isSaved && onUnsave) {
                  onUnsave(savedJobId || job.id);
                } else if (onSave) {
                  onSave(job.id);
                }
              }}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}