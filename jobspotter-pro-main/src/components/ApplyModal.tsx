import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Job } from '@/lib/api';
import { Loader2, Send, Building2, MapPin } from 'lucide-react';

interface ApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resumeUrl: string, coverLetter?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ApplyModal({ 
  job, 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting = false 
}: ApplyModalProps) {
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resumeUrl.trim()) {
      setError('Please provide a resume URL');
      return;
    }

    try {
      await onSubmit(resumeUrl, coverLetter);
      setResumeUrl('');
      setCoverLetter('');
      onClose();
    } catch (err) {
      setError('Failed to submit application. Please try again.');
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Apply for Position</DialogTitle>
          <DialogDescription>
            <div className="mt-2 rounded-lg bg-secondary p-3">
              <h4 className="font-semibold text-foreground">{job.title}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resumeUrl">Resume URL *</Label>
            <Input
              id="resumeUrl"
              type="url"
              placeholder="https://drive.google.com/your-resume.pdf"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Provide a link to your resume (Google Drive, Dropbox, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell us why you're the perfect fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
