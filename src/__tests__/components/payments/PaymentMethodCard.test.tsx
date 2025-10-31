import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaymentMethodCard } from '@/components/payments/PaymentMethodCard'

// Mock the icons
jest.mock('lucide-react', () => ({
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  Trash2: () => <div data-testid="trash-icon">Trash2</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  MoreVertical: () => <div data-testid="more-icon">MoreVertical</div>,
}))

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardContent: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardHeader: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  CardTitle: ({ children, className, ...props }: any) => <h3 className={className} {...props}>{children}</h3>,
  CardDescription: ({ children, className, ...props }: any) => <p className={className} {...props}>{children}</p>,
  CardFooter: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} {...props}>
      {children}
    </span>
  ),
}))

const mockPaymentMethod = {
  id: 'pm_123',
  userId: 'user_123',
  type: 'credit_card' as const,
  provider: 'stripe' as const,
  isDefault: false,
  isActive: true,
  maskedDetails: {
    brand: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    holderName: 'John Doe',
  },
  billingAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  isVerified: true,
  verifiedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockDefaultPaymentMethod = {
  ...mockPaymentMethod,
  id: 'pm_default123',
  isDefault: true,
}

describe('PaymentMethodCard', () => {
  const mockOnEdit = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSetDefault = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders payment method information correctly', () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument()
    expect(screen.getByText('Expires 12/25')).toBeInTheDocument()
    expect(screen.getByTestId('credit-card-icon')).toBeInTheDocument()
  })

  it('shows default badge for default payment method', () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockDefaultPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    const editButton = screen.getByTestId('edit-icon').closest('div')
    fireEvent.click(editButton!)

    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(mockPaymentMethod.id)
    })
  })

  it('calls onDelete when delete button is clicked', async () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    const deleteButton = screen.getByTestId('trash-icon').closest('div')
    fireEvent.click(deleteButton!)

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockPaymentMethod.id)
    })
  })

  it('calls onSetDefault when set as default is clicked', async () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    const setDefaultButton = screen.getByText('Set as Default')
    fireEvent.click(setDefaultButton)

    await waitFor(() => {
      expect(mockOnSetDefault).toHaveBeenCalledWith(mockPaymentMethod.id)
    })
  })

  it('does not show set as default option for default payment method', () => {
    render(
      <PaymentMethodCard
        paymentMethod={mockDefaultPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    expect(screen.queryByText('Set as Default')).not.toBeInTheDocument()
  })

  it('handles different card brands correctly', () => {
    const mastercardMethod = {
      ...mockPaymentMethod,
      maskedDetails: {
        ...mockPaymentMethod.maskedDetails,
        brand: 'mastercard',
      },
    }

    render(
      <PaymentMethodCard
        paymentMethod={mastercardMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    expect(screen.getByText('MASTERCARD •••• •••• •••• 4242')).toBeInTheDocument()
  })

  it('handles expired cards correctly', () => {
    const expiredMethod = {
      ...mockPaymentMethod,
      maskedDetails: {
        ...mockPaymentMethod.maskedDetails,
        expiryMonth: 1,
        expiryYear: 2020,
      },
    }

    render(
      <PaymentMethodCard
        paymentMethod={expiredMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    expect(screen.getByText('Expires 01/20')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    const { container } = render(
      <PaymentMethodCard
        paymentMethod={mockPaymentMethod}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSetDefault={mockOnSetDefault}
      />
    )

    const card = container.firstChild
    expect(card).toHaveClass('hover:shadow-md', 'transition-shadow')
  })
})