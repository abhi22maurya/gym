import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      retry: 1, // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on every tab switch for better UX
    },
  },
});
