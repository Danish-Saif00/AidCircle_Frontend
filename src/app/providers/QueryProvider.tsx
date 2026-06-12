import React, {useState} from 'react';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import {AppState, type AppStateStatus} from 'react-native';

const STALE_TIME_MS = 30 * 1000;
const GC_TIME_MS = 5 * 60 * 1000;

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        retry: failureCount => failureCount < 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

const handleAppStateChange = (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
};

onlineManager.setEventListener(setOnline => {
  setOnline(true);

  return () => undefined;
});

export type QueryProviderProps = {
  children: React.ReactNode;
};

export const QueryProvider = ({children}: QueryProviderProps) => {
  const [queryClient] = useState(createQueryClient);

  React.useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};