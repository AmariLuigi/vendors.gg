'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import VendorLogo from '@/components/ui/vendor-logo';
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, Shield, ShoppingCart, Store, Users, MessageSquare } from 'lucide-react';
import { signIn } from 'next-auth/react';

type AccountType = 'buyer' | 'seller' | 'both';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('buyer');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeNewsletter: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log('Registration attempt:', { ...formData, accountType });
  };

  const accountTypes = [
    {
      type: 'buyer' as AccountType,
      title: 'Buyer',
      description: 'Purchase gaming items and accounts',
      icon: ShoppingCart,
      features: ['Browse marketplace', 'Secure purchases', 'Order tracking']
    },
    {
      type: 'seller' as AccountType,
      title: 'Seller',
      description: 'Sell your gaming items and accounts',
      icon: Store,
      features: ['Create listings', 'Manage inventory', 'Sales analytics']
    },
    {
      type: 'both' as AccountType,
      title: 'Both',
      description: 'Buy and sell on the marketplace',
      icon: Users,
      features: ['Full marketplace access', 'Buyer & seller tools', 'Complete dashboard']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <VendorLogo size="lg" className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Join vendors.gg</h1>
          <p className="text-muted-foreground">
            Create your account and start trading securely
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Choose your account type and fill in your details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Account Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accountTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card
                      key={type.type}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        accountType === type.type
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setAccountType(type.type)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${
                          accountType === type.type ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <h3 className="font-semibold mb-1">{type.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{type.description}</p>
                        <div className="space-y-1">
                          {type.features.map((feature, index) => (
                            <div key={index} className="text-xs text-muted-foreground">
                              • {feature}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Social Registration */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => signIn('google')}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Continue with Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => signIn('github')}
              >
                <Github className="w-4 h-4 mr-2" />
                Continue with GitHub
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={() => signIn('discord')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Continue with Discord
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or register with email
                </span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 mt-1"
                    required
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    id="subscribeNewsletter"
                    name="subscribeNewsletter"
                    type="checkbox"
                    checked={formData.subscribeNewsletter}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 mt-1"
                  />
                  <Label htmlFor="subscribeNewsletter" className="text-sm leading-relaxed">
                    Subscribe to our newsletter for updates and exclusive offers
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Account
              </Button>
            </form>

            {/* Trust Indicator */}
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-accent" />
              <span>Your data is protected and encrypted</span>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Trust Indicators */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              🔒 SSL Encrypted
            </Badge>
            <Badge variant="outline" className="text-xs">
              🛡️ Escrow Protected
            </Badge>
            <Badge variant="outline" className="text-xs">
              📧 Email Verification
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}