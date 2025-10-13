'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Heart, X, Info } from 'lucide-react'

interface DonationBannerProps {
  email?: string
  itemName?: string
  currency?: string
}

export function DonationBanner({
  email = process.env.NEXT_PUBLIC_PAYPAL_EMAIL || '',
  itemName = 'Support Document Chat - Free AI Models',
  currency = 'USD'
}: DonationBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Don't render if no email is configured
  if (!email) {
    return null
  }

  useEffect(() => {
    setIsMounted(true)

    // Clean up old permanent dismiss key (migration)
    const oldDismissed = localStorage.getItem('donation-banner-dismissed')
    if (oldDismissed) {
      localStorage.removeItem('donation-banner-dismissed')
    }

    // Check if banner was dismissed and if enough time has passed
    const dismissedUntil = localStorage.getItem('donation-banner-dismissed-until')
    if (dismissedUntil) {
      const dismissedTimestamp = parseInt(dismissedUntil, 10)
      const now = Date.now()
      // Show banner again if 6 hours have passed
      if (now > dismissedTimestamp) {
        setIsVisible(true)
        localStorage.removeItem('donation-banner-dismissed-until')
      }
    } else {
      // No dismiss record, show the banner
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    // Hide banner for 6 hours
    const sixHoursFromNow = Date.now() + (6 * 60 * 60 * 1000)
    localStorage.setItem('donation-banner-dismissed-until', sixHoursFromNow.toString())
  }

  const handleDonate = () => {
    const donateUrl = `https://www.paypal.com/donate/?business=${encodeURIComponent(email)}&item_name=${encodeURIComponent(itemName)}&currency_code=${currency}`
    window.open(donateUrl, '_blank')
  }

  // Prevent SSR mismatch by not rendering until mounted
  if (!isMounted || !isVisible) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            {/* Message Section */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Heart className="h-5 w-5 flex-shrink-0 text-red-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  <span className="hidden sm:inline">Help us keep AI models free for everyone! </span>
                  <span className="sm:hidden">Support free AI access </span>
                  <span className="text-blue-100">Your donations cover API costs.</span>
                </p>
              </div>

              {/* Info Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex-shrink-0 text-blue-200 hover:text-white transition-colors"
                    aria-label="More information"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-4" side="bottom">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Why donate?</p>
                    <p className="text-xs leading-relaxed">
                      Your donations help us provide free AI-powered document analysis, chat,
                      and matching services to users who can't afford premium AI subscriptions.
                      Every contribution helps cover API costs and keeps these powerful tools
                      accessible to everyone.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Every contribution makes a difference!
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleDonate}
                size="sm"
                variant="secondary"
                className="bg-white text-blue-700 hover:bg-blue-50 font-medium whitespace-nowrap"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5" />
                Donate
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-blue-800/50 h-8 w-8 p-0"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
