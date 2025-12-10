import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'applied' | 'shortlisted' | 'rejected' | 'interview' | 'selected';
}

const statusConfig = {
  // Use existing variants from badge.tsx
  applied: { label: 'Applied', variant: 'secondary' as const }, // Using 'secondary'
  
  // 🔥 FIX: Use 'under-review' variant for Shortlisted status
  shortlisted: { label: 'Shortlisted', variant: 'under-review' as const }, 
  
  // 🔥 FIX: Use 'warning' variant for Interview status
  interview: { label: 'Interview Scheduled', variant: 'warning' as const }, 
  
  selected: { label: 'Selected', variant: 'success' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const },
};

// Map status to config, using 'applied' as a safe default if the key is somehow missing
export function StatusBadge({ status }: StatusBadgeProps) {
  // Use a default label for safety, matching 'applied' if the status is unexpected
  const config = statusConfig[status] || statusConfig.applied; 
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}