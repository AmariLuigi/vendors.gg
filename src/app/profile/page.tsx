'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Calendar, 
  Building, 
  CreditCard, 
  Truck, 
  Clock, 
  Shield, 
  Star,
  Edit,
  Save,
  X
} from 'lucide-react';

interface ProfileData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  accountType: 'buyer' | 'seller';
  bio: string | null;
  avatar: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  language: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  businessName: string | null;
  businessType: string | null;
  taxId: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  website: string | null;
  socialLinks: string | null;
  preferredGames: string | null;
  tradingRegions: string | null;
  paymentMethods: string | null;
  deliveryMethods: string | null;
  responseTime: string | null;
  tradingHours: string | null;
  verificationLevel: string | null;
  twoFactorEnabled: boolean | null;
  rating: number | null;
  totalReviews: number | null;
  totalSales: number | null;
  totalPurchases: number | null;
  completionRate: number | null;
  profileCompletion: number | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData(data);
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
        
        // Refresh the session to update the header with new name
        await update();
        
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the profile state with new avatar URL
        setProfile(prev => prev ? { ...prev, avatar: result.avatarUrl } : null);
        setFormData(prev => ({ ...prev, avatar: result.avatarUrl }));
        
        // Refresh the session to update the header avatar
        await update();
        
        toast.success('Avatar uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update the profile state to remove avatar
        setProfile(prev => prev ? { ...prev, avatar: null } : null);
        setFormData(prev => ({ ...prev, avatar: null }));
        
        // Refresh the session to update the header avatar
        await update();
        
        toast.success('Avatar removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Failed to remove avatar');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          <p className="text-gray-600 mt-2">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Completion */}
        {profile.profileCompletion !== null && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Profile Completion</h3>
                  <p className="text-sm text-gray-600">Complete your profile to improve trust and visibility</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{profile.profileCompletion}%</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profile.profileCompletion}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* General Information */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <div className="mb-6">
                      <AvatarUpload
                        currentAvatar={profile.avatar}
                        userName={`${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
                        onUpload={handleAvatarUpload}
                        onRemove={handleAvatarRemove}
                        isLoading={avatarUploading}
                        className="flex flex-col items-center"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.avatar || ''} />
                        <AvatarFallback className="text-lg">
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {profile.firstName} {profile.lastName}
                        </h3>
                        <p className="text-gray-600">{profile.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={profile.accountType === 'seller' ? 'default' : 'secondary'}>
                            {profile.accountType}
                          </Badge>
                          {profile.isVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {profile.rating && typeof profile.rating === 'number' && (
                            <Badge variant="outline">
                              <Star className="h-3 w-3 mr-1" />
                              {profile.rating.toFixed(1)} ({profile.totalReviews || 0} reviews)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editing ? (formData.firstName || '') : (profile.firstName || '')}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editing ? (formData.lastName || '') : (profile.lastName || '')}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editing ? (formData.phone || '') : (profile.phone || '')}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editing ? (formData.country || '') : (profile.country || '')}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={editing ? (formData.timezone || '') : (profile.timezone || '')}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Input
                        id="language"
                        value={editing ? (formData.language || '') : (profile.language || '')}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editing ? (formData.bio || '') : (profile.bio || '')}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!editing}
                      rows={4}
                      placeholder="Tell others about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Business Information */}
          <TabsContent value="business">
            {profile.accountType === 'seller' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={editing ? (formData.businessName || '') : (profile.businessName || '')}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Input
                        id="businessType"
                        value={editing ? (formData.businessType || '') : (profile.businessType || '')}
                        onChange={(e) => handleInputChange('businessType', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={editing ? (formData.taxId || '') : (profile.taxId || '')}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={editing ? (formData.businessPhone || '') : (profile.businessPhone || '')}
                        onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input
                        id="businessEmail"
                        value={editing ? (formData.businessEmail || '') : (profile.businessEmail || '')}
                        onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={editing ? (formData.website || '') : (profile.website || '')}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="businessAddress">Business Address</Label>
                    <Textarea
                      id="businessAddress"
                      value={editing ? (formData.businessAddress || '') : (profile.businessAddress || '')}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      disabled={!editing}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Information</h3>
                    <p className="text-gray-600">Business information is only available for seller accounts.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trading Preferences */}
          <TabsContent value="trading">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Trading Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredGames">Preferred Games</Label>
                    <Textarea
                      id="preferredGames"
                      value={editing ? (formData.preferredGames || '') : (profile.preferredGames || '')}
                      onChange={(e) => handleInputChange('preferredGames', e.target.value)}
                      disabled={!editing}
                      rows={3}
                      placeholder="List your preferred games..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="tradingRegions">Trading Regions</Label>
                    <Textarea
                      id="tradingRegions"
                      value={editing ? (formData.tradingRegions || '') : (profile.tradingRegions || '')}
                      onChange={(e) => handleInputChange('tradingRegions', e.target.value)}
                      disabled={!editing}
                      rows={3}
                      placeholder="Regions you trade in..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentMethods">Payment Methods</Label>
                    <Textarea
                      id="paymentMethods"
                      value={editing ? (formData.paymentMethods || '') : (profile.paymentMethods || '')}
                      onChange={(e) => handleInputChange('paymentMethods', e.target.value)}
                      disabled={!editing}
                      rows={3}
                      placeholder="Accepted payment methods..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryMethods">Delivery Methods</Label>
                    <Textarea
                      id="deliveryMethods"
                      value={editing ? (formData.deliveryMethods || '') : (profile.deliveryMethods || '')}
                      onChange={(e) => handleInputChange('deliveryMethods', e.target.value)}
                      disabled={!editing}
                      rows={3}
                      placeholder="Available delivery methods..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="responseTime">Response Time</Label>
                    <Input
                      id="responseTime"
                      value={editing ? (formData.responseTime || '') : (profile.responseTime || '')}
                      onChange={(e) => handleInputChange('responseTime', e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Within 2 hours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tradingHours">Trading Hours</Label>
                    <Input
                      id="tradingHours"
                      value={editing ? (formData.tradingHours || '') : (profile.tradingHours || '')}
                      onChange={(e) => handleInputChange('tradingHours', e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., 9 AM - 6 PM EST"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats">
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile.totalSales || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Sales</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile.totalPurchases || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Purchases</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile.completionRate ? `${profile.completionRate}%` : 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Member since:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Last updated:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(profile.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Verification Level:</span>
                      <span className="ml-2 text-gray-600">
                        {profile.verificationLevel || 'Basic'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Two-Factor Auth:</span>
                      <span className="ml-2 text-gray-600">
                        {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}