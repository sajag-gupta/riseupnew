import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Search,
  Library,
  Music,
  Calendar,
  ShoppingBag,
  User,
  BarChart3,
  Upload,
  Settings,
  Heart,
  Clock,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location === path;

  const fanLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/discover", icon: Search, label: "Discover" },
    { href: "/dashboard", icon: User, label: "Dashboard" },
  ];

  const fanLibraryLinks = [
    { href: "/playlists", icon: Library, label: "Playlists" },
    { href: "/liked", icon: Heart, label: "Liked Songs" },
    { href: "/recent", icon: Clock, label: "Recently Played" },
    { href: "/following", icon: Users, label: "Following" },
  ];

  const artistLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/discover", icon: Search, label: "Discover" },
    { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  ];

  const artistCreatorLinks = [
    { href: "/upload", icon: Upload, label: "Upload Music" },
    { href: "/my-music", icon: Music, label: "My Music" },
    { href: "/my-merch", icon: ShoppingBag, label: "My Merch" },
    { href: "/my-events", icon: Calendar, label: "My Events" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
  ];

  const adminLinks = [
    { href: "/admin", icon: Settings, label: "Admin Panel" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/content", icon: Music, label: "Content" },
    { href: "/admin/reports", icon: BarChart3, label: "Reports" },
  ];

  const renderLinkGroup = (
    title: string,
    links: { href: string; icon: any; label: string }[]
  ) => (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
        {title}
      </h4>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Button
              variant={isActive(link.href) ? "secondary" : "ghost"}
              className={`w-full justify-start ${
                isActive(link.href) 
                  ? "bg-accent text-accent-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid={`sidebar-${link.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {link.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="hidden md:flex w-64 border-r border-border bg-card/50 fixed left-0 top-16 h-[calc(100vh-4rem)] z-40">
      <div className="flex flex-col w-full">
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {/* Main Navigation */}
            {user?.role === 'artist' ? (
              <>
                {renderLinkGroup("Navigate", artistLinks)}
                <Separator />
                {renderLinkGroup("Creator Tools", artistCreatorLinks)}
              </>
            ) : (
              <>
                {renderLinkGroup("Navigate", fanLinks)}
                <Separator />
                {renderLinkGroup("Your Library", fanLibraryLinks)}
              </>
            )}

            {/* Admin Section */}
            {user?.role === 'admin' && (
              <>
                <Separator />
                {renderLinkGroup("Administration", adminLinks)}
              </>
            )}

            {/* Made for You (Fan specific) */}
            {user?.role === 'fan' && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
                    Made for You
                  </h4>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                    data-testid="sidebar-daily-mix"
                  >
                    <Music className="mr-3 h-4 w-4" />
                    Daily Mix
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
                    data-testid="sidebar-discover-weekly"
                  >
                    <Search className="mr-3 h-4 w-4" />
                    Discover Weekly
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Bottom section */}
        <div className="p-3 border-t border-border">
          <Link href="/settings">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent"
              data-testid="sidebar-settings"
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}