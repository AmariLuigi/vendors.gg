'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageContent from '@/components/layout/PageContent';
import { ShoppingCart, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    // Skip redirect logic if authentication is failing
    if (status === 'unauthenticated') {
      // Don't redirect to login for now since auth isn't set up
      return;
    }

    // Only redirect if we have a valid session with user data
    if (session?.user?.accountType) {
      if (session.user.accountType === 'buyer') {
        router.push('/dashboard/buyer');
      } else if (session.user.accountType === 'seller') {
        router.push('/dashboard/seller');
      }
    }
    // If accountType is 'both' or undefined, show selection page
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard selection even without authentication for demo purposes

  // Show dashboard selection for users with 'both' account type or no specific type
  return (
    <PageContent className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-8"
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold mb-2"
          >
            Welcome to your Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground"
          >
            Choose how you'd like to use vendors.gg today
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/buyer">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Buyer Dashboard</CardTitle>
                <CardDescription>
                  Browse listings, manage orders, and track purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• View and manage your orders</li>
                  <li>• Track favorites and wishlist</li>
                  <li>• Message sellers</li>
                  <li>• Browse marketplace</li>
                </ul>
                <Button className="w-full mt-4">
                  Go to Buyer Dashboard
                </Button>
              </CardContent>
            </Link>
          </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/seller">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                  <Store className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle>Seller Dashboard</CardTitle>
                <CardDescription>
                  Manage listings, track sales, and grow your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Create and manage listings</li>
                  <li>• Track sales and analytics</li>
                  <li>• Communicate with buyers</li>
                  <li>• Manage inventory</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Go to Seller Dashboard
                </Button>
              </CardContent>
            </Link>
          </Card>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8"
        >
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-muted-foreground mb-4"
          >
            Need help getting started?
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-4"
          >
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="ghost" size="sm">
              View Documentation
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </PageContent>
  );
}