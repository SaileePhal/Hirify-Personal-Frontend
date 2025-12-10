import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="animate-pulse space-y-4">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-secondary" />
          <div className="h-5 w-20 rounded-full bg-secondary" />
        </div>
        <div className="h-6 w-3/4 rounded bg-secondary" />
        <div className="flex gap-4">
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-4 w-32 rounded bg-secondary" />
        </div>
        <div className="h-16 w-full rounded bg-secondary" />
        <div className="h-4 w-40 rounded bg-secondary" />
      </div>
    </div>
  );
}
