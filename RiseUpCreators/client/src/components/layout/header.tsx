import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search,
  Bell,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import AuthModal from "@/components/auth/auth-modal";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: user ? "/home" : "/", label: "Home" },
    { href: "/discover", label: "Discover" },
    { href: "/events", label: "Events" },
    { href: "/merch", label: "Merch" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && !user) return location === "/";
    if (href === "/home" && user) return location === "/home";
    return location === href;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/discover?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleDashboardNavigation = () => {
    if (!user) return;

    switch (user.role) {
      case "artist":
        setLocation("/creator");
        break;
      case "admin":
        setLocation("/admin");
        break;
      default:
        setLocation("/dashboard");
    }
  };

  // Fetch cart data for cart badge
  const { data: cartData } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Optional search suggestions query
  const { data: searchData } = useQuery({
    queryKey: ["/api/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { songs: [], artists: [] };

      const [songsRes, artistsRes] = await Promise.all([
        fetch(`/api/songs/search?q=${encodeURIComponent(searchQuery)}`),
        fetch(`/api/artists/search?q=${encodeURIComponent(searchQuery)}`),
      ]);

      const songs = songsRes.ok ? await songsRes.json() : [];
      const artists = artistsRes.ok ? await artistsRes.json() : [];

      return { songs, artists };
    },
    enabled: !!searchQuery,
    staleTime: 30 * 1000,
  });

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-effect border-b border-border backdrop-blur-lg"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={user ? "/home" : "/"}
            className="flex items-center space-x-2 hover-glow"
          >
            <img
              src="/logo.png"
              alt="Rise Up Creators Logo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="text-xl font-bold hidden sm:block">
              Rise Up Creators
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link transition-colors ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search songs, artists, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-input border-border rounded-2xl pl-10 pr-4 py-2 focus-primary"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-muted"
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {user ? (
              <>
                {/* Cart */}
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartData?.items?.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center p-0 text-xs bg-primary">
                        {cartData.items.length}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-muted"
                  data-testid="notifications-button"
                >
                  <Bell className="w-5 h-5" />
                  <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-primary" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 hover:bg-muted rounded-2xl p-2"
                      data-testid="user-menu-trigger"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                          }
                        />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">
                        {user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={handleDashboardNavigation}
                      data-testid="dashboard-menu-item"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" data-testid="settings-menu-item">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      data-testid="logout-menu-item"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowAuthModal(true)}
                  data-testid="login-button"
                >
                  Sign In
                </Button>
                <Button
                  className="gradient-primary hover:opacity-90"
                  onClick={() => setShowAuthModal(true)}
                  data-testid="signup-button"
                >
                  Join Now
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  data-testid="mobile-menu-trigger"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-effect border-border">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-input border-border rounded-2xl pl-10 pr-4 py-2"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  </form>

                  {/* Mobile Navigation Links */}
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors ${
                        isActive(link.href)
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {user && (
                    <>
                      <hr className="border-border" />
                      <button
                        onClick={() => {
                          handleDashboardNavigation();
                          setMobileMenuOpen(false);
                        }}
                        className="text-lg font-medium text-left text-foreground hover:text-primary transition-colors"
                      >
                        Dashboard
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="text-lg font-medium text-left text-foreground hover:text-primary transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
