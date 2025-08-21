import { Link } from "wouter";
import { Music, Twitter, Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  const companyLinks = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
  ];

  const platformLinks = [
    { href: "/discover", label: "Discover Music" },
    { href: "/artists", label: "Browse Artists" },
    { href: "/events", label: "Events" },
    { href: "/merch", label: "Merchandise" },
  ];

  const artistLinks = [
    { href: "/upload", label: "Upload Music" },
    { href: "/analytics", label: "Analytics" },
    { href: "/monetization", label: "Monetization" },
    { href: "/tools", label: "Promotion Tools" },
  ];

  const supportLinks = [
    { href: "/help", label: "Help Center" },
    { href: "/contact", label: "Contact Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ];

  const socialLinks = [
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
    { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
    { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Company */}
          <div className="col-span-2 md:col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 red-gradient rounded-lg p-1">
                <div className="w-full h-full bg-card rounded-sm flex items-center justify-center">
                  <Music className="w-4 h-4 text-primary" />
                </div>
              </div>
              <span className="text-lg font-bold">Rise Up Creators</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Empowering independent artists and connecting them directly with fans through music, 
              merchandise, and experiences.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid={`social-${social.label.toLowerCase()}`}
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span 
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      data-testid={`footer-platform-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Artists */}
          <div>
            <h3 className="font-semibold mb-4">For Artists</h3>
            <ul className="space-y-2 text-sm">
              {artistLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span 
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      data-testid={`footer-artist-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span 
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      data-testid={`footer-support-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2024 Rise Up Creators. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-sm">
            <Link href="/privacy">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/terms">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Terms
              </span>
            </Link>
            <Link href="/cookies">
              <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                Cookies
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
