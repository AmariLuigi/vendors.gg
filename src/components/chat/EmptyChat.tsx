'use client';

import { MessageCircle, Users, ShoppingBag, Shield } from 'lucide-react';

export function EmptyChat() {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="max-w-md mx-auto text-center p-8">
        {/* Icon */}
        <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome to Messages
        </h2>
        <p className="text-muted-foreground">
          Start a conversation with sellers or buyers to discuss listings, negotiate prices, and complete transactions.
        </p>

        {/* Features */}
        <div className="mt-8 space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
            <Users className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-foreground mb-1">
                Connect with Users
              </h3>
              <p className="text-sm text-muted-foreground">
                Message sellers about their listings or respond to buyer inquiries.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
            <ShoppingBag className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-foreground mb-1">
                Discuss Listings
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask questions about items, negotiate prices, and arrange transactions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-card rounded-lg border border-border">
            <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-foreground mb-1">
                Secure Communication
              </h3>
              <p className="text-sm text-muted-foreground">
                All messages are secure and tied to your account for safety.
              </p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary">
            <strong>Tip:</strong> Click on any listing to start a conversation with the seller!
          </p>
        </div>
      </div>
    </div>
  );
}