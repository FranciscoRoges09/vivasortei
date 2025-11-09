/**
 * Utility to track conversion events with Facebook pixel
 * UTM parameters são rastreados via BuckPay metadata
 */

interface ConversionEventData {
  value?: number
  currency?: string
  status?: "pending" | "approved"
  quantity?: number
  transactionId?: string
  email?: string
  name?: string
  cpf?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

/**
 * Wait for Facebook pixel to be available
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
 * Track event with Facebook pixel
 */
export const trackWithFacebook = async (
  eventName: "Lead" | "Purchase",
  data: ConversionEventData,
): Promise<boolean> => {
  const fbq = await waitForFbq()

  if (!fbq || typeof fbq !== "function") {
    console.warn("[v0] Facebook pixel not available for tracking:", eventName)
    return false
  }

  try {
    const trackingData: any = {}

    if (data.value) trackingData.value = data.value
    if (data.currency) trackingData.currency = data.currency
    if (data.quantity) trackingData.quantity = data.quantity
    if (data.transactionId) trackingData.transaction_id = data.transactionId
    if (data.email) trackingData.email = data.email
    if (data.utm_source) trackingData.utm_source = data.utm_source
    if (data.utm_campaign) trackingData.utm_campaign = data.utm_campaign
    if (data.utm_medium) trackingData.utm_medium = data.utm_medium
    if (data.utm_content) trackingData.utm_content = data.utm_content
    if (data.utm_term) trackingData.utm_term = data.utm_term

    console.log(`[v0] Facebook Pixel - ${eventName}:`, trackingData)
    fbq("track", eventName, trackingData)
    return true
  } catch (error) {
    console.error(`[v0] Error tracking Facebook ${eventName} event:`, error)
    return false
  }
}

/**
 * Track Lead event (início do checkout)
 */
export const trackLead = async (email: string, name?: string): Promise<void> => {
  const data: ConversionEventData = { email, name }
  await trackWithFacebook("Lead", data)
}

/**
 * Track Pending Purchase event (PIX gerado, ainda não pago)
 * Nota: Para venda pendente, não enviamos evento de purchase ao Facebook
 * Os parâmetros UTM são salvos no BuckPay metadata
 */
export const trackPendingPurchase = async (data: ConversionEventData): Promise<void> => {
  console.log("[v0] Pending Purchase - UTM parameters stored in BuckPay metadata:", {
    utm_source: data.utm_source,
    utm_campaign: data.utm_campaign,
    utm_medium: data.utm_medium,
    utm_content: data.utm_content,
    utm_term: data.utm_term,
  })
}

/**
 * Track Purchase event (Pagamento confirmado)
 */
export const trackPurchase = async (data: ConversionEventData): Promise<void> => {
  const trackingData: ConversionEventData = {
    ...data,
    status: "approved",
  }
  await trackWithFacebook("Purchase", trackingData)
}
