import React from 'react';
import Link from 'next/link';
import VendorLogo from '@/components/ui/vendor-logo';
import { Shield, Star, Users, Zap } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <VendorLogo size="md" />
              <div>
                <h3 className="text-lg font-bold text-primary">vendors.gg</h3>
                <p className="text-sm text-muted-foreground">Trusted Gaming Marketplace</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The most secure and trusted marketplace for gaming items, accounts, and services. 
              Protected by escrow and verified sellers.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-accent" />
                <span>Escrow Protected</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-accent" />
                <span>Verified Sellers</span>
              </div>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/games" className="hover:text-primary transition-colors">
                  Browse Games
                </Link>
              </li>
              <li>
                <Link href="/games/league-of-legends" className="hover:text-primary transition-colors">
                  League of Legends
                </Link>
              </li>
              <li>
                <Link href="/games/world-of-warcraft" className="hover:text-primary transition-colors">
                  World of Warcraft
                </Link>
              </li>
              <li>
                <Link href="/games/valorant" className="hover:text-primary transition-colors">
                  Valorant
                </Link>
              </li>
              <li>
                <Link href="/games/csgo" className="hover:text-primary transition-colors">
                  CS:GO
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-primary transition-colors">
                  Start Selling
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-primary transition-colors">
                  Safety & Security
                </Link>
              </li>
              <li>
                <Link href="/dispute-resolution" className="hover:text-primary transition-colors">
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h5 className="font-semibold">100% Secure</h5>
              <p className="text-sm text-muted-foreground">All transactions protected by escrow</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h5 className="font-semibold">Verified Sellers</h5>
              <p className="text-sm text-muted-foreground">Only trusted and verified vendors</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h5 className="font-semibold">Fast Delivery</h5>
              <p className="text-sm text-muted-foreground">Quick and reliable item delivery</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 vendors.gg. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;