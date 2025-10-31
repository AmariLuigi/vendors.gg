"use client"

import * as React from "react"
import { Shield, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { EscrowHold } from "@/lib/types/payment"

interface EscrowCardProps {
  escrow: EscrowHold
  onRelease?: (escrowId: string, amount?: number) => void
  onDispute?: (escrowId: string, reason: string) => void
  className?: string
  showActions?: boolean
  currentUserId?: string
}

export function EscrowCard({
  escrow,
  onRelease,
  onDispute,
  className,
  showActions = true,
  currentUserId
}: EscrowCardProps) {
  const [isReleasing, setIsReleasing] = React.useState(false)
  const [isDisputing, setIsDisputing] = React.useState(false)

  const getStatusIcon = () => {
    switch (escrow.status) {
      case 'held':
        return <Shield className="size-4 text-blue-500" />
      case 'partial_release':
        return <DollarSign className="size-4 text-yellow-500" />
      case 'released':
        return <CheckCircle className="size-4 text-green-500" />
      case 'disputed':
        return <AlertTriangle className="size-4 text-red-500" />
      case 'expired':
        return <Clock className="size-4 text-gray-500" />
      default:
        return <Shield className="size-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (escrow.status) {
      case 'held':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'partial_release':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'released':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'disputed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const calculateReleaseProgress = () => {
    if (escrow.status === 'released') return 100
    if (!escrow.releasedAmount || escrow.releasedAmount === 0) return 0
    return (escrow.releasedAmount / escrow.amount) * 100
  }

  const getRemainingAmount = () => {
    return escrow.amount - (escrow.releasedAmount || 0)
  }

  const getTimeRemaining = () => {
    if (!escrow.expiresAt) return null
    
    const now = new Date()
    const expiry = new Date(escrow.expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  const isBuyer = currentUserId === escrow.buyerId
  const isSeller = currentUserId === escrow.sellerId
  const canRelease = escrow.status === 'held' && isBuyer
  const canDispute = (escrow.status === 'held' || escrow.status === 'partial_release') && isSeller

  const handleRelease = async () => {
    if (!onRelease) return
    setIsReleasing(true)
    try {
      await onRelease(escrow.id)
    } finally {
      setIsReleasing(false)
    }
  }

  const handleDispute = async () => {
    if (!onDispute) return
    setIsDisputing(true)
    try {
      const reason = prompt('Please provide a reason for the dispute:')
      if (reason) {
        await onDispute(escrow.id, reason)
      }
    } finally {
      setIsDisputing(false)
    }
  }

  return (
    <Card className={cn("relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Escrow #{escrow.id.slice(-8)}</span>
              <Badge className={cn("text-xs", getStatusColor())}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{escrow.status.replace('_', ' ')}</span>
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Order #{escrow.orderId.slice(-8)}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {formatCurrency(escrow.amount, escrow.currency)}
            </div>
            {escrow.releasedAmount && escrow.releasedAmount > 0 && (
              <div className="text-xs text-muted-foreground">
                {formatCurrency(escrow.releasedAmount, escrow.currency)} released
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {escrow.status === 'partial_release' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Release Progress</span>
              <span>{Math.round(calculateReleaseProgress())}%</span>
            </div>
            <Progress value={calculateReleaseProgress()} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {formatCurrency(getRemainingAmount(), escrow.currency)} remaining
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(escrow.createdAt).toLocaleDateString()}</span>
          </div>
          
          {escrow.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span className={cn(
                getTimeRemaining() === 'Expired' && 'text-red-500'
              )}>
                {getTimeRemaining()}
              </span>
            </div>
          )}

          {escrow.releasedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Released:</span>
              <span>{new Date(escrow.releasedAt).toLocaleDateString()}</span>
            </div>
          )}

          {escrow.disputedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Disputed:</span>
              <span>{new Date(escrow.disputedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {escrow.disputeReason && (
          <>
            <Separator />
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Dispute Reason:</span>
              <div className="text-sm p-2 bg-muted rounded">{escrow.disputeReason}</div>
            </div>
          </>
        )}

        {escrow.notes && (
          <>
            <Separator />
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Notes:</span>
              <div className="text-sm p-2 bg-muted rounded">{escrow.notes}</div>
            </div>
          </>
        )}

        {showActions && (canRelease || canDispute) && (
          <>
            <Separator />
            <div className="flex gap-2">
              {canRelease && (
                <Button
                  onClick={handleRelease}
                  disabled={isReleasing}
                  size="sm"
                >
                  {isReleasing ? 'Releasing...' : 'Release Funds'}
                </Button>
              )}
              {canDispute && (
                <Button
                  variant="outline"
                  onClick={handleDispute}
                  disabled={isDisputing}
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  {isDisputing ? 'Disputing...' : 'Dispute'}
                </Button>
              )}
            </div>
          </>
        )}

        {escrow.status === 'held' && isBuyer && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            💡 Funds are held securely until you confirm delivery and release them to the seller.
          </div>
        )}

        {escrow.status === 'held' && isSeller && (
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
            ⏳ Waiting for buyer to confirm delivery and release funds.
          </div>
        )}
      </CardContent>
    </Card>
  )
}