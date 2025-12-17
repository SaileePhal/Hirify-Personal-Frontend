import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Application } from '@/lib/api';
import { 
  FileText, 
  Calendar, 
  Building2, 
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ApplicationCardProps {
  application: Application;
  isRecruiter?: boolean;
  // 🔥 Add the new prop
  canEdit: boolean;
  onEdit?: (application: Application) => void;
  onWithdraw?: (id: string) => void;
  // 🔥 FIX: Update the status prop type to match the new flow
  onStatusChange?: (id: string, status: 'selected' | 'rejected' | 'shortlisted' | 'interview') => void;}

export function ApplicationCard({ 
  application, 
  isRecruiter = false,
  canEdit, // 🔥 Destructure the new prop
  onEdit,
  onWithdraw,
  onStatusChange
}: ApplicationCardProps) {
  
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={application.status} />
          </div>

          {application.job && (
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                {application.job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {application.job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {application.job.location}
                </span>
              </div>
            </div>
          )}

          {isRecruiter && application.candidate_name && ( // 🔥 TWEAK 1: Only need to check for name to display the card
            <div className="mb-3 rounded-lg bg-secondary p-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {application.candidate_name}
                </span>
                
                {/* 🔥 TWEAK 2: Only display the email span if it exists AND is NOT "N/A" */}
                {application.candidate_email && application.candidate_email !== 'N/A' && (
                  <span className="text-muted-foreground">
                    ({application.candidate_email})
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Applied {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true })}
            </div>
            {application.resume_url && (
              <a
                href={application.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                View Resume
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {application.cover_letter && (
            <div className="mt-3 rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {application.cover_letter}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {isRecruiter && onStatusChange ? (
          <>
            <Button
              // 🔥 FIX: Check for 'shortlisted' (or similar) instead of 'under-review' 
              // and ensure the status passed to onStatusChange is valid.
              // Change variant check to 'shortlisted'
              variant={application.status === 'shortlisted' || application.status === 'applied' ? 'default' : 'outline'}              
              size="sm"
              // Call the correct status from your SQL schema
              // 🔥 FIX: Call the 'shortlisted' status (which replaces 'under-review' in your flow)
              onClick={() => onStatusChange(application.id, 'shortlisted')} 
            >
              Shortlist
            </Button>
            <Button
              // 🔥 FIX 2: Add Interview button
              variant={application.status === 'interview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(application.id, 'interview')}
            >
              Interview
            </Button>
            <Button
              variant={application.status === 'selected' ? 'success' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(application.id, 'selected')}
            >
              Select
            </Button>
            <Button
              variant={application.status === 'rejected' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(application.id, 'rejected')}
            >
              Reject
            </Button>
          </>
        ) : (
          <>
            {/* 🔥 CONDITIONAL RENDERING */}
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(application)}>
                <Edit className="h-4 w-4" />
                Edit Application
              </Button>
            )}
            {onWithdraw && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onWithdraw(application.id)}
              >
                <Trash2 className="h-4 w-4" />
                Withdraw
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
