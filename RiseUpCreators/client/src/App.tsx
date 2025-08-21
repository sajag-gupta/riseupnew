import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

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
import FanDashboard from "@/pages/fan/Dashboard";
import Discover from "@/pages/Discover";
import Events from "@/pages/Events";
import Merch from "@/pages/MerchStore";
import AdminPanel from "@/pages/admin/AdminPanel";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 pt-16 pb-24">
          {children}
        </main>
      </div>
      <MusicPlayer />
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
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
      {isAuthenticated ? (
        <>
          <Route path="/">
            <AuthenticatedLayout>
              <Home />
            </AuthenticatedLayout>
          </Route>

          <Route path="/discover">
            <AuthenticatedLayout>
              <Discover />
            </AuthenticatedLayout>
          </Route>

          <Route path="/events">
            <AuthenticatedLayout>
              <Events />
            </AuthenticatedLayout>
          </Route>

          <Route path="/merch">
            <AuthenticatedLayout>
              <Merch />
            </AuthenticatedLayout>
          </Route>

          <Route path="/dashboard">
            <AuthenticatedLayout>
              {user?.role === 'artist' ? <ArtistDashboard /> : <FanDashboard />}
            </AuthenticatedLayout>
          </Route>

          {user?.role === 'admin' && (
            <Route path="/admin">
              <AuthenticatedLayout>
                <AdminPanel />
              </AuthenticatedLayout>
            </Route>
          )}
        </>
      ) : (
        /* Landing page for non-authenticated users */
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
