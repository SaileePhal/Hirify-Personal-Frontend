import { useState, useEffect, useCallback } from 'react';
import { getJobApplicationStatus } from '@/lib/api'; 
// Assuming correct path to api.ts

export const useApplicationStatus = (jobId: string | undefined | null) => {
  const [status, setStatus] = useState<'not_applied' | 'loading' | string>('loading');
  const [error, setError] = useState<string | null>(null);
  // Add a state variable to explicitly trigger re-fetching
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Define the fetching logic using useCallback
  const fetchStatus = useCallback(async () => {
    if (!jobId) {
      setStatus('not_applied');
      return;
    }

    setStatus('loading');
    setError(null);
    
    const { data, error } = await getJobApplicationStatus(jobId);

    if (error) {
      setError(error);
      setStatus('not_applied'); // Assume not applied on error
      return;
    }

    if (data && data.status) {
      setStatus(data.status); // e.g., 'applied', 'under-review', 'selected'
    } else {
      setStatus('not_applied');
    }
  }, [jobId, fetchTrigger]); // fetchTrigger is a dependency

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]); // Depend on fetchStatus (which includes jobId and fetchTrigger)

  // Define the refetch function to update the trigger state
  const refetchStatus = useCallback(() => {
    setFetchTrigger(prev => prev + 1);
  }, []);

  // isApplied is true if status is anything other than 'not_applied' or 'loading'
  const isApplied = status !== 'not_applied' && status !== 'loading';

  return { 
    status, 
    isApplied, 
    isLoading: status === 'loading', 
    error,
    // 🔥 CRITICAL: Return the refetch function
    refetch: refetchStatus, 
  };
};