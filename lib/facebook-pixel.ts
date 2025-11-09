/**
 * Meta Pixel (Facebook) Official Implementation
 * https://developers.facebook.com/docs/meta-pixel/reference
 *
 * Implements complete funnel: PageView → ViewContent → Lead → AddToCart →
 * InitiateCheckout → AddPaymentInfo → Purchase
 */

interface FacebookPixelEventData {
  value?: number
  currency?: string
  content_ids?: string[]
  content_type?: string
  content_name?: string
  order_id?: string
  status?: string
  num_items?: number
  [key: string]: any
}

/**
 * Wait for fbq to be available
 */
const waitForFbq = (maxAttempts = 50): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null)
      return
    }

    if (typeof window.fbq === "function") {
      resolve(window.fbq)
      return
    }

    let attempts = 0
    const checkInterval = setInterval(() => {
      attempts++
      if (typeof window.fbq === "function") {
        clearInterval(checkInterval)
        resolve(window.fbq)
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(null)
      }
    }, 100)
  })
}

/**
 * PageView - Fire on every page load
 */
export const trackPageView = async (): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for PageView")
    return
  }

  try {
    fbq("track", "PageView")
    console.log("[v0] Meta Pixel: PageView tracked")
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking PageView", error)
  }
}

/**
 * ViewContent - Fire when user views product/offer
 */
export const trackViewContent = async (contentId: string, contentName: string): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for ViewContent")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      content_ids: [contentId],
      content_name: contentName,
      content_type: "product",
    }

    fbq("track", "ViewContent", data)
    console.log("[v0] Meta Pixel: ViewContent tracked", data)
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking ViewContent", error)
  }
}

/**
 * Lead - Fire when user starts checkout (form engagement)
 */
export const trackLead = async (email: string, name?: string, utm_data?: Record<string, string>): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for Lead")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      ...(email && { em: email }),
      ...(utm_data && utm_data),
    }

    fbq("track", "Lead", data)
    console.log("[v0] Meta Pixel: Lead tracked", { email: "***", ...data })
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking Lead", error)
  }
}

/**
 * AddToCart - Fire when user selects quantity/adds to cart
 */
export const trackAddToCart = async (value: number, quantity: number, currency = "BRL"): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for AddToCart")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      value: value,
      currency: currency,
      content_ids: ["titulo-viva-sorte"],
      content_type: "product",
      num_items: quantity,
    }

    fbq("track", "AddToCart", data)
    console.log("[v0] Meta Pixel: AddToCart tracked", data)
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking AddToCart", error)
  }
}

/**
 * InitiateCheckout - Fire when checkout modal opens
 */
export const trackInitiateCheckout = async (value: number, quantity: number, currency = "BRL"): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for InitiateCheckout")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      value: value,
      currency: currency,
      content_ids: ["titulo-viva-sorte"],
      content_type: "product",
      num_items: quantity,
    }

    fbq("track", "InitiateCheckout", data)
    console.log("[v0] Meta Pixel: InitiateCheckout tracked", data)
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking InitiateCheckout", error)
  }
}

/**
 * AddPaymentInfo - Fire when user submits payment info (PIX generated)
 */
export const trackAddPaymentInfo = async (value: number, quantity: number, currency = "BRL"): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for AddPaymentInfo")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      value: value,
      currency: currency,
      content_ids: ["titulo-viva-sorte"],
      content_type: "product",
      num_items: quantity,
    }

    fbq("track", "AddPaymentInfo", data)
    console.log("[v0] Meta Pixel: AddPaymentInfo tracked", data)
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking AddPaymentInfo", error)
  }
}

/**
 * Purchase - Fire on successful payment confirmation
 * REQUIRED parameters: value, currency, content_ids, content_type, order_id
 */
export const trackPurchase = async (
  value: number,
  quantity: number,
  orderId: string,
  email?: string,
  utm_data?: Record<string, string>,
  currency = "BRL",
): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for Purchase")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      value: value,
      currency: currency,
      content_ids: ["titulo-viva-sorte"],
      content_name: "Viva Sorte - Títulos",
      content_type: "product",
      num_items: quantity,
      order_id: orderId,
      ...(email && { em: email }),
      ...(utm_data && utm_data),
    }

    fbq("track", "Purchase", data)
    console.log("[v0] Meta Pixel: Purchase tracked", { ...data, email: email ? "***" : undefined })
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking Purchase", error)
  }
}

/**
 * Search - Fire when user filters or searches
 */
export const trackSearch = async (searchString?: string): Promise<void> => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Meta Pixel: fbq not available for Search")
    return
  }

  try {
    const data: FacebookPixelEventData = {
      ...(searchString && { search_string: searchString }),
    }

    fbq("track", "Search", data)
    console.log("[v0] Meta Pixel: Search tracked", data)
  } catch (error) {
    console.error("[v0] Meta Pixel: Error tracking Search", error)
  }
}
