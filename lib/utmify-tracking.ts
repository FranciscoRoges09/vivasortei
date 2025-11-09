/**
 * Utility to track Purchase events with UTMify
 * Handles the asynchronous nature of UTMify pixel loading
 */

interface PurchaseEventData {
  value: number
  currency: string
  status?: string
  quantity?: number
  transactionId?: string
}

export const trackUTMifyPurchase = (data: PurchaseEventData): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      resolve(false)
      return
    }

    // Try to track immediately if UTMify is already loaded
    if ((window as any).utmify && typeof (window as any).utmify.track === "function") {
      try {
        ;(window as any).utmify.track("Purchase", {
          value: data.value,
          currency: data.currency,
          status: data.status || "pending",
          ...(data.quantity && { quantity: data.quantity }),
          ...(data.transactionId && { transactionId: data.transactionId }),
        })
        console.log("[v0] UTMify Purchase event tracked successfully")
        resolve(true)
      } catch (error) {
        console.error("[v0] Error tracking UTMify Purchase event:", error)
        resolve(false)
      }
      return
    }

    // If UTMify is not loaded yet, wait for it with a timeout
    let attempts = 0
    const maxAttempts = 50 // 5 seconds with 100ms intervals
    const checkInterval = setInterval(() => {
      attempts++

      if ((window as any).utmify && typeof (window as any).utmify.track === "function") {
        clearInterval(checkInterval)
        try {
          ;(window as any).utmify.track("Purchase", {
            value: data.value,
            currency: data.currency,
            status: data.status || "pending",
            ...(data.quantity && { quantity: data.quantity }),
            ...(data.transactionId && { transactionId: data.transactionId }),
          })
          console.log("[v0] UTMify Purchase event tracked successfully (after waiting)")
          resolve(true)
        } catch (error) {
          console.error("[v0] Error tracking UTMify Purchase event:", error)
          resolve(false)
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        console.warn("[v0] UTMify was not loaded within timeout period")
        resolve(false)
      }
    }, 100)
  })
}
