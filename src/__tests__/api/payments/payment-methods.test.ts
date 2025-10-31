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
    delete: jest.fn(),
  },
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

import { GET, POST, PATCH, DELETE } from '@/app/api/payments/methods/route'
import { db } from '@/lib/db'
import { paymentMethods } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const mockDb = db as jest.Mocked<typeof db>

describe('/api/payments/methods', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/payments/methods', () => {
    it('should return payment methods for authenticated user', async () => {
      const mockPaymentMethods = [
        {
          id: 'pm_1',
          userId: 'user_1',
          type: 'card',
          provider: 'stripe',
          providerPaymentMethodId: 'pm_stripe_1',
          cardBrand: 'visa',
          cardLast4: '4242',
          cardExpMonth: 12,
          cardExpYear: 2025,
          isDefault: true,
          billingAddress: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockPaymentMethods),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/payments/methods')
      
      // Mock session
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPaymentMethods)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/payments/methods')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/payments/methods', () => {
    it('should create a new payment method', async () => {
      const mockPaymentMethod = {
        id: 'pm_new',
        userId: 'user_1',
        type: 'card',
        provider: 'stripe',
        providerPaymentMethodId: 'pm_stripe_new',
        cardBrand: 'mastercard',
        cardLast4: '5555',
        cardExpMonth: 6,
        cardExpYear: 2026,
        isDefault: false,
        billingAddress: {
          line1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockPaymentMethod]),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const requestBody = {
        type: 'card',
        provider: 'stripe',
        providerPaymentMethodId: 'pm_stripe_new',
        cardBrand: 'mastercard',
        cardLast4: '5555',
        cardExpMonth: 6,
        cardExpYear: 2026,
        billingAddress: {
          line1: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90210',
          country: 'US',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/payments/methods', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPaymentMethod)
    })

    it('should validate required fields', async () => {
      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/methods', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('validation')
    })
  })

  describe('PATCH /api/payments/methods', () => {
    it('should update payment method', async () => {
      const mockUpdatedMethod = {
        id: 'pm_1',
        userId: 'user_1',
        isDefault: true,
        updatedAt: new Date(),
      }

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedMethod]),
          }),
        }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/methods', {
        method: 'PATCH',
        body: JSON.stringify({
          paymentMethodId: 'pm_1',
          isDefault: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('DELETE /api/payments/methods', () => {
    it('should delete payment method', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 1 }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/methods?paymentMethodId=pm_1', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 if payment method not found', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({ rowCount: 0 }),
      } as any)

      const { getServerSession } = require('next-auth/next')
      getServerSession.mockResolvedValue({
        user: { id: 'user_1', email: 'test@example.com' },
      })

      const request = new NextRequest('http://localhost:3000/api/payments/methods?paymentMethodId=pm_nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})