"use client";

/**
 * WearableConnectionStatus Component
 * 
 * Shows connected wearable providers with status badges.
 * Allows users to connect/disconnect providers via OAuth.
 * 
 * CRITICAL: Matches iOS app design - clean connection management
 */

import { useState, useEffect } from "react";
import { Watch, CheckCircle, XCircle, Clock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WearableConnectionStatusProps {
  userId: string;
  className?: string;
}

interface WearableConnection {
  id: string;
  provider: string;
  last_sync_at: string | null;
  sync_status: string;
  created_at: string;
}

const PROVIDER_INFO: Record<string, { name: string; color: string; icon: string }> = {
  whoop: { name: "WHOOP", color: "bg-red-500", icon: "🔴" },
  oura: { name: "Oura Ring", color: "bg-purple-500", icon: "💍" },
  garmin: { name: "Garmin", color: "bg-blue-500", icon: "⌚" },
  fitbit: { name: "Fitbit", color: "bg-teal-500", icon: "📊" },
  apple_health: { name: "Apple Health", color: "bg-pink-500", icon: "🍎" },
  polar: { name: "Polar", color: "bg-cyan-500", icon: "❄️" },
  terra: { name: "Terra", color: "bg-green-500", icon: "🌍" },
};

const AVAILABLE_PROVIDERS = ["whoop", "oura", "garmin", "fitbit", "apple_health", "polar", "terra"];

export function WearableConnectionStatus({ userId, className }: WearableConnectionStatusProps) {
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [userId]);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/connections/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      setConnectingProvider(provider);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/connect/${provider}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate connection');
      }

      const data = await response.json();
      
      // Open OAuth URL in new window
      if (data.authorization_url) {
        window.open(data.authorization_url, '_blank', 'width=600,height=700');
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          await fetchConnections();
          const connected = connections.some(c => c.provider === provider);
          if (connected) {
            clearInterval(pollInterval);
            setConnectingProvider(null);
          }
        }, 3000);

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setConnectingProvider(null);
        }, 120000);
      }
    } catch (error) {
      console.error("Error connecting provider:", error);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${PROVIDER_INFO[provider]?.name || provider}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/wearables/disconnect/${provider}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect provider');
      }

      await fetchConnections();
    } catch (error) {
      console.error("Error disconnecting provider:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-accent-light-green dark:text-accent-dark-green" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-accent-light-coral dark:text-accent-dark-coral" />;
      default:
        return <Clock className="w-4 h-4 text-accent-light-yellow dark:text-accent-dark-yellow" />;
    }
  };

  const connectedProviders = connections.map(c => c.provider);
  const availableToConnect = AVAILABLE_PROVIDERS.filter(p => !connectedProviders.includes(p));

  return (
    <div className={cn("card space-y-md", className)}>
      {/* Header */}
      <div className="flex items-center gap-sm">
        <Watch className="w-5 h-5 text-accent-light-purple dark:text-accent-dark-purple" />
        <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Connected Wearables
        </h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-text-light-tertiary dark:text-text-dark-tertiary">Loading connections...</p>
        </div>
      ) : (
        <>
          {/* Connected Devices */}
          {connections.length > 0 && (
            <div className="space-y-sm">
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                Active Connections
              </h3>
              {connections.map((connection) => {
                const info = PROVIDER_INFO[connection.provider] || { name: connection.provider, color: "bg-gray-500", icon: "📱" };
                const lastSync = connection.last_sync_at
                  ? new Date(connection.last_sync_at).toLocaleString()
                  : "Never";

                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-md rounded-lg bg-surface-light-secondary dark:bg-surface-dark-secondary"
                  >
                    <div className="flex items-center gap-md">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl", info.color)}>
                        {info.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                          {info.name}
                        </p>
                        <div className="flex items-center gap-xs text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                          {getStatusIcon(connection.sync_status)}
                          <span>Last sync: {lastSync}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(connection.provider)}
                      className="p-sm rounded-lg hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary transition-colors"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4 text-accent-light-coral dark:text-accent-dark-coral" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Available to Connect */}
          {availableToConnect.length > 0 && (
            <div className="space-y-sm">
              <h3 className="text-sm font-semibold text-text-light-secondary dark:text-text-dark-secondary">
                Available Devices
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                {availableToConnect.map((provider) => {
                  const info = PROVIDER_INFO[provider] || { name: provider, color: "bg-gray-500", icon: "📱" };
                  const isConnecting = connectingProvider === provider;

                  return (
                    <button
                      key={provider}
                      onClick={() => handleConnect(provider)}
                      disabled={isConnecting}
                      className={cn(
                        "flex flex-col items-center gap-sm p-md rounded-lg border-2 border-dashed transition-all",
                        "border-border-light dark:border-border-dark",
                        "hover:border-accent-light-blue dark:hover:border-accent-dark-blue",
                        "hover:bg-surface-light-secondary dark:hover:bg-surface-dark-secondary",
                        isConnecting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-xl", info.color)}>
                        {info.icon}
                      </div>
                      <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                        {isConnecting ? "Connecting..." : info.name}
                      </span>
                      {!isConnecting && (
                        <Plus className="w-4 h-4 text-accent-light-blue dark:text-accent-dark-blue" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {connections.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-md">
              <Watch className="w-12 h-12 text-text-light-tertiary dark:text-text-dark-tertiary" />
              <p className="text-text-light-tertiary dark:text-text-dark-tertiary text-center">
                No wearables connected yet. Connect a device to start tracking your health metrics.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

