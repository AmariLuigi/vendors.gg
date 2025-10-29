import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/profile - Get current user's profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, session.user.id))
      .limit(1);

    if (!profile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Remove sensitive fields from response
    const { password, ...profileData } = profile[0];
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Remove fields that shouldn't be updated via this endpoint
    const {
      id,
      email,
      password,
      createdAt,
      updatedAt,
      totalSales,
      totalPurchases,
      totalEarnings,
      totalSpent,
      rating,
      totalReviews,
      completionRate,
      averageDeliveryTime,
      disputeCount,
      positiveFeedbackCount,
      negativeFeedbackCount,
      verificationLevel,
      kycStatus,
      accountStatus,
      ...updateData
    } = body;

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Calculate profile completion percentage
    const profileFields = [
      'firstName', 'lastName', 'bio', 'avatar', 'phone', 'country', 
      'timezone', 'preferredGames', 'tradingRegions', 'paymentMethods'
    ];
    
    let completedFields = 0;
    profileFields.forEach(field => {
      if (updateData[field] || session.user[field]) {
        completedFields++;
      }
    });
    
    updateData.profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    const updatedProfile = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, session.user.id))
      .returning();

    if (!updatedProfile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Remove sensitive fields from response
    const { password: _, ...profileData } = updatedProfile[0];
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/profile - Partial update of current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Remove fields that shouldn't be updated via this endpoint
    const restrictedFields = [
      'id', 'email', 'password', 'createdAt', 'updatedAt',
      'totalSales', 'totalPurchases', 'totalEarnings', 'totalSpent',
      'rating', 'totalReviews', 'completionRate', 'averageDeliveryTime',
      'disputeCount', 'positiveFeedbackCount', 'negativeFeedbackCount',
      'verificationLevel', 'kycStatus', 'accountStatus'
    ];

    const updateData: any = {};
    Object.keys(body).forEach(key => {
      if (!restrictedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const updatedProfile = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, session.user.id))
      .returning();

    if (!updatedProfile.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Remove sensitive fields from response
    const { password: _, ...profileData } = updatedProfile[0];
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}