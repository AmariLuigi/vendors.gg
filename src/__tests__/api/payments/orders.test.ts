import { NextRequest } from 'next/server'

// Mock Next.js server components before importing the route
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    headers: new Map(),
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}))

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn(),
  },
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { GET, POST, PATCH } from '@/app/api/payments/orders/route'
import { db } from '@/lib/db'

const mockDb = db as jest.Mocked<typeof db>

describe('/api/payments/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/payments/orders', () => {
    it('should return orders for authenticated user', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          orderNumber: 'ORD-2023-001',
          buyerId: 'user_1',
          sellerId: 'user_2',
          listingId: 'listing_1',
          paymentMethodId: 'pm_1',
          status: 'pending',
          paymentStatus: 'pending',
          deliveryStatus: 'pending',
          quantity: 1,
          unitPrice: 1000,
          totalAmount: 1000,
          currency: 'USD',
          platformFee: 50,
          processingFee: 30,
          sellerAmount: 920,
          deliveryMethod: 'digital',
          notes: 'Test order',
          createdAt: new Date(),
          updatedAt: new Date(),
          listing: {
            id: 'listing_1',
            title: 'Test Item',
            price: 1000,
            images: ['image1.jpg'],
          },
          buyer: {
            id: 'user_1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
          seller: {
            id: 'user_2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockOrders),
                }),
              }),
            }),
          }),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'john@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/orders')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockOrders)
    })

    it('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order_1',
          status: 'completed',
          // ... other fields
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockOrders),
                }),
              }),
            }),
          }),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'john@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/orders?status=completed')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/payments/orders', () => {
    it('should create a new order', async () => {
      const mockOrder = {
        id: 'order_new',
        buyerId: 'user_1',
        sellerId: 'user_2',
        listingId: '550e8400-e29b-41d4-a716-446655440001',
        status: 'pending',
        quantity: 2,
        unitPrice: '500.00',
        totalAmount: '1000.00',
        platformFee: '50.00',
        processingFee: '30.00',
        sellerAmount: '920.00',
        currency: 'USD',
        paymentStatus: 'pending',
        deliveryStatus: 'pending',
        orderNumber: 'ORD-123456-ABC123',
        buyerNotes: 'New test order',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock the listing query
      mockDb.query = {
        listings: {
          findFirst: jest.fn().mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440001',
            sellerId: 'user_2',
            status: 'active',
            price: '500.00',
            quantity: 10,
            seller: {
              id: 'user_2',
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com'
            }
          })
        }
      } as any

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockOrder]),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'john@example.com' },
      })

      const requestBody = {
        listingId: '550e8400-e29b-41d4-a716-446655440001',
        quantity: 2,
        buyerNotes: 'New test order',
      }

      const request = new NextRequest('http://localhost:3000/api/payments/orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockOrder)
    })

    it('should validate required fields', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'john@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/orders', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
    })

    it('should prevent self-purchase', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'john@example.com' },
      })

      // Mock the listing query to return a listing owned by the same user
      mockDb.query = {
        listings: {
          findFirst: jest.fn().mockResolvedValue({
            id: '550e8400-e29b-41d4-a716-446655440000',
            sellerId: 'user_1', // Same as the authenticated user
            status: 'active',
            price: '100.00',
            quantity: 10,
            seller: {
              id: 'user_1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com'
            }
          })
        }
      } as any

      const requestBody = {
        listingId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 1,
      }

      const request = new NextRequest('http://localhost:3000/api/payments/orders', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Cannot purchase your own listing')
    })
  })

  describe('PATCH /api/payments/orders', () => {
    it('should update order status', async () => {
      const mockUpdatedOrder = {
        id: 'order_1',
        status: 'shipped',
        updatedAt: new Date(),
      }

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedOrder]),
          }),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_2', email: 'jane@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          orderId: 'order_1',
          status: 'shipped',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should validate status transitions', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_2', email: 'jane@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/orders', {
        method: 'PATCH',
        body: JSON.stringify({
          orderId: 'order_1',
          status: 'invalid_status',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})