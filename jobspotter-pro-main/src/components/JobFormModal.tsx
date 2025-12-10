import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { createJob, updateJob, Job } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface JobFormModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobFormModal({ job, isOpen, onClose, onSuccess }: JobFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'Full-time',
    experience_level: 'Mid-level',
    salary_min: '',
    salary_max: '',
    description: '',
    // 🔥 FIX 1: Add state for requirements (will be a comma-separated string)
    requirements: '',
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        company: job.company,
        location: job.location,
        job_type: job.job_type,
        experience_level: job.experience_level,
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        description: job.description,
        // 🔥 FIX 2: Load requirements from job data (convert array to comma-separated string)
        requirements: (job.requirements || []).join(', '),
      });
    } else {
      setFormData({
        title: '',
        company: '',
        location: '',
        job_type: 'Full-time',
        experience_level: 'Mid-level',
        salary_min: '',
        salary_max: '',
        description: '',
        requirements: '', // Set default empty string
      });
    }
  }, [job, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Helper to clean and split the requirements string into an array
    const parsedRequirements = formData.requirements
      .split(',') // Split by comma
      .map(s => s.trim()) // Trim whitespace from each item
      .filter(s => s.length > 0); // Remove empty strings

    const payload = {
      title: formData.title,
      company: formData.company,
      location: formData.location,
      // 🔥 FIX: Convert job_type to lowercase before sending to match SQL check constraint
      job_type: formData.job_type.toLowerCase(),
      experience_level: formData.experience_level,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
      description: formData.description,
      // 🔥 FIX 3: Include the parsed requirements array
      requirements: parsedRequirements,
    };

    let result;
    if (job) {
      result = await updateJob(job.id, payload);
    } else {
      result = await createJob(payload);
    }

    setLoading(false);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: job ? 'Job updated' : 'Job created',
        description: job ? 'The job listing has been updated' : 'Your new job listing is live',
      });
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {job ? 'Edit Job Listing' : 'Create Job Listing'}
          </DialogTitle>
          <DialogDescription>
            {job ? 'Update the details of your job listing.' : 'Fill in the details to create a new job listing.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Acme Inc."
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA or Remote"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select
                value={formData.job_type}
                onValueChange={(value) => setFormData({ ...formData, job_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select
                value={formData.experience_level}
                onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entry-level">Entry-level</SelectItem>
                  <SelectItem value="Mid-level">Mid-level</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_min">Min Salary ($)</Label>
              <Input
                id="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                placeholder="e.g. 80000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Max Salary ($)</Label>
              <Input
                id="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                placeholder="e.g. 120000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Required Skills (Comma-separated)</Label>
            <Input
              id="requirements"
              value={formData.requirements}
              // 🔥 FIX 4: Bind input to the new requirements state field
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. React, TypeScript, Python, Flask"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              rows={6}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {job ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                job ? 'Update Job' : 'Create Job'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
