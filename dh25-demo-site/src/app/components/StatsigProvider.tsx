'use client';

import { StatsigClient } from '@statsig/js-client';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';
import { useEffect, useState } from 'react';

// Global Statsig client instance
let statsigClientInstance: StatsigClient | null = null;

export function getStatsigClient(): StatsigClient | null {
  return statsigClientInstance;
}

export default function StatsigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only initialize on client side
    if (!isClient) return;

    const initializeStatsig = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
        
        if (!clientKey) {
          console.warn('⚠️  NEXT_PUBLIC_STATSIG_CLIENT_KEY not found, skipping Statsig initialization');
          return;
        }

        statsigClientInstance = new StatsigClient(
          clientKey, 
          { userID: "user-id" },
          {
            plugins: [
              new StatsigSessionReplayPlugin(),
              new StatsigAutoCapturePlugin(),
            ],
          }
        );

        await statsigClientInstance.initializeAsync();
        console.log('✅ Statsig SDK initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize Statsig SDK:', error);
      }
    };

    initializeStatsig();
  }, [isClient]);

  // Don't render anything until client-side
  if (!isClient) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
