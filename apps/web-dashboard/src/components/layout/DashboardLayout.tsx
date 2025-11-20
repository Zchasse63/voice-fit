"use client";

/**
 * DashboardLayout Component
 * 
 * Main layout for the unified dashboard.
 * Detects user type (premium vs coach) and shows appropriate navigation.
 * 
 * CRITICAL: Matches iOS app design - clean, minimal navigation
 */

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Activity, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  coachOnly?: boolean;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState<"premium" | "coach" | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUserType();
  }, []);

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch user profile to get user_type
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      setUserType(profile?.user_type || "premium");
    } catch (error) {
      console.error("Error checking user type:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Analytics", href: "/dashboard/analytics", icon: Activity },
    { name: "Clients", href: "/coach/clients", icon: Users, coachOnly: true },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.coachOnly || userType === "coach"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light-primary dark:bg-background-dark-primary">
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-light-primary dark:bg-background-dark-primary">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r border-border-light-light dark:border-border-dark-light">
        {/* Logo */}
        <div className="p-lg border-b border-border-light-light dark:border-border-dark-light">
          <h1 className="text-2xl font-bold text-primary-500 dark:text-primary-dark">
            VoiceFit
          </h1>
          {userType === "coach" && (
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
              Coach Dashboard
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-md space-y-xs overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-sm px-md py-sm rounded-md transition-colors text-left",
                  isActive
                    ? "bg-primary-500 dark:bg-primary-dark text-white"
                    : "text-text-light-primary dark:text-text-dark-primary hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-md border-t border-border-light-light dark:border-border-dark-light space-y-xs">
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="w-full flex items-center gap-sm px-md py-sm rounded-md text-text-light-primary dark:text-text-dark-primary hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors text-left"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-sm px-md py-sm rounded-md text-error-light dark:text-error-dark hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background-light-primary dark:bg-background-dark-primary border-b border-border-light-light dark:border-border-dark-light">
        <div className="flex items-center justify-between p-md">
          <h1 className="text-xl font-bold text-primary-500 dark:text-primary-dark">
            VoiceFit
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border-light-light dark:border-border-dark-light p-md space-y-xs">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-sm px-md py-sm rounded-md transition-colors text-left",
                    isActive
                      ? "bg-primary-500 dark:bg-primary-dark text-white"
                      : "text-text-light-primary dark:text-text-dark-primary hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                router.push("/dashboard/settings");
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-sm px-md py-sm rounded-md text-text-light-primary dark:text-text-dark-primary hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors text-left"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-sm px-md py-sm rounded-md text-error-light dark:text-error-dark hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-[73px]">
        <div className="max-w-7xl mx-auto p-lg">
          {children}
        </div>
      </main>
    </div>
  );
}


