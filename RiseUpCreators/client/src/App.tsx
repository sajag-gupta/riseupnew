
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, Suspense } from "react";
import type { User } from "@shared/schema";

// Layout components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MusicPlayer from "@/components/layout/MusicPlayer";
import Sidebar from "@/components/layout/Sidebar";

// Pages
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ArtistProfile from "@/pages/artist/ArtistProfile";
import ArtistDashboard from "@/pages/artist/Dashboard";
import UploadMusic from "@/pages/artist/UploadMusic";
import FanDashboard from "@/pages/fan/Dashboard";
import Discover from "@/pages/Discover";
import Events from "@/pages/Events";
import Merch from "@/pages/MerchStore";
import AdminPanel from "@/pages/AdminPanel";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

function AuthenticatedLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  return useMemo(() => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 pt-16 pb-24">{children}</main>
      </div>
      <MusicPlayer />
    </div>
  ), [children]);
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return useMemo(() => (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  ), [children]);
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Memoize the loading state to prevent unnecessary re-renders
  const loadingComponent = useMemo(() => <LoadingSpinner />, []);

  // Show loading only during initial authentication check
  if (isLoading) {
    return loadingComponent;
  }

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/login">
        <PublicLayout>
          <Login />
        </PublicLayout>
      </Route>

      <Route path="/register">
        <PublicLayout>
          <Register />
        </PublicLayout>
      </Route>

      <Route path="/artist/:id">
        <PublicLayout>
          <ArtistProfile />
        </PublicLayout>
      </Route>

      {/* Authenticated routes */}
      {isAuthenticated && user ? (
        <>
          <Route path="/">
            <AuthenticatedLayout user={user}>
              <Home />
            </AuthenticatedLayout>
          </Route>

          <Route path="/discover">
            <AuthenticatedLayout user={user}>
              <Discover />
            </AuthenticatedLayout>
          </Route>

          <Route path="/events">
            <AuthenticatedLayout user={user}>
              <Events />
            </AuthenticatedLayout>
          </Route>

          <Route path="/merch">
            <AuthenticatedLayout user={user}>
              <Merch />
            </AuthenticatedLayout>
          </Route>

          <Route path="/dashboard">
            <AuthenticatedLayout user={user}>
              {user.role === "artist" ? <ArtistDashboard /> : <FanDashboard />}
            </AuthenticatedLayout>
          </Route>

          <Route path="/settings">
            <AuthenticatedLayout user={user}>
              <Settings />
            </AuthenticatedLayout>
          </Route>

          <Route path="/upload">
            <AuthenticatedLayout user={user}>
              <UploadMusic />
            </AuthenticatedLayout>
          </Route>

          {user.role === "admin" && (
            <Route path="/admin">
              <AuthenticatedLayout user={user}>
                <AdminPanel />
              </AuthenticatedLayout>
            </Route>
          )}
        </>
      ) : (
        // Landing page for non-authenticated users
        <Route path="/">
          <PublicLayout>
            <Landing />
          </PublicLayout>
        </Route>
      )}

      {/* Fallback to 404 */}
      <Route>
        <PublicLayout>
          <NotFound />
        </PublicLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Router />
        </Suspense>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
