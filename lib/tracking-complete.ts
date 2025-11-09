/**
 * Tracking centralizado (Facebook + UTMify)
 * Rastreia venda pendente e venda aprovada separadamente
 */

import { getAllUTMData } from "./utm-utils"

interface ConversionEventData {
  value?: number
  currency?: string
  status?: "pending" | "approved"
  quantity?: number
  transactionId?: string
  email?: string
  name?: string
  cpf?: string
  offer_name?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

/* ========== FACEBOOK ========== */
const waitForFbq = (maxAttempts = 50): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if (typeof (window as any).fbq === "function") return resolve((window as any).fbq)

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (typeof (window as any).fbq === "function") {
        clearInterval(interval)
        resolve((window as any).fbq)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(null)
      }
    }, 100)
  })
}

const trackWithFacebook = async (
  event: "Lead" | "Purchase" | "InitiateCheckout" | "AddPaymentInfo",
  data: ConversionEventData,
) => {
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Facebook pixel not loaded:", event)
    return
  }

  try {
    const trackingData: any = {}

    if (data.value) trackingData.value = data.value
    if (data.currency) trackingData.currency = data.currency
    if (data.quantity) trackingData.num_items = data.quantity
    if (data.transactionId) trackingData.order_id = data.transactionId
    if (data.email) trackingData.em = data.email
    if (data.utm_source) trackingData.utm_source = data.utm_source
    if (data.utm_campaign) trackingData.utm_campaign = data.utm_campaign
    if (data.utm_medium) trackingData.utm_medium = data.utm_medium
    if (data.utm_content) trackingData.utm_content = data.utm_content
    if (data.utm_term) trackingData.utm_term = data.utm_term

    // Add required fields for Purchase event
    if (event === "Purchase") {
      trackingData.content_ids = ["titulo-viva-sorte"]
      trackingData.content_type = "product"
    }

    // Add required fields for InitiateCheckout event
    if (event === "InitiateCheckout") {
      trackingData.content_ids = ["titulo-viva-sorte"]
      trackingData.content_type = "product"
    }

    // Add required fields for AddPaymentInfo event
    if (event === "AddPaymentInfo") {
      trackingData.content_ids = ["titulo-viva-sorte"]
      trackingData.content_type = "product"
    }

    console.log(`[v0] Facebook Pixel - ${event}:`, trackingData)
    fbq("track", event, trackingData)
  } catch (e) {
    console.error("[v0] FB Pixel Error:", e)
  }
}

/* ========== UTMIFY ========== */
const waitForUtmify = (maxAttempts = 50): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null)
    if ((window as any).utmify && typeof (window as any).utmify.track === "function")
      return resolve((window as any).utmify)

    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if ((window as any).utmify && typeof (window as any).utmify.track === "function") {
        clearInterval(interval)
        resolve((window as any).utmify)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(null)
      }
    }, 100)
  })
}

const trackWithUTMify = async (event: "pendente" | "purchase", data: ConversionEventData) => {
  const utmify = await waitForUtmify()
  if (!utmify) {
    console.warn("[v0] UTMify not loaded yet:", event)
    return
  }

  try {
    const utmifyData: any = {
      event: event,
      value: data.value || 0,
      currency: data.currency || "BRL",
      transaction_id: data.transactionId || "",
      status: data.status || (event === "pendente" ? "pending" : "approved"),
      quantity: data.quantity || 1,
      email: data.email || "",
      offer_name: data.offer_name || "VIVA SORTE",
      utm_source: data.utm_source || "",
      utm_medium: data.utm_medium || "",
      utm_campaign: data.utm_campaign || "",
      utm_content: data.utm_content || "",
      utm_term: data.utm_term || "",
    }

    console.log(`[v0] UTMify - ${event} event payload:`, utmifyData)
    utmify.track(event, utmifyData)
  } catch (e) {
    console.error("[v0] UTMify Error:", e)
  }
}

/* ========== EVENTOS EXPORTADOS ========== */

// Início de checkout
export const trackLead = async (email: string, name?: string) => {
  const utm = getAllUTMData()
  const data: ConversionEventData = { email, name, ...utm }
  await trackWithFacebook("Lead", data)
  console.log("[v0] Lead enviado para Facebook com UTM:", data)
}

// Início do checkout (modal aberto)
export const trackInitiateCheckout = async (value: number, quantity: number, currency = "BRL") => {
  const utm = getAllUTMData()
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Facebook pixel not loaded: InitiateCheckout")
    return
  }

  try {
    const data: any = {
      value,
      currency,
      num_items: quantity,
      content_ids: ["titulo-viva-sorte"],
      content_type: "product",
      ...utm,
    }

    console.log("[v0] Facebook Pixel - InitiateCheckout:", data)
    fbq("track", "InitiateCheckout", data)
  } catch (e) {
    console.error("[v0] FB Pixel InitiateCheckout Error:", e)
  }
}

// Informação de pagamento adicionada (PIX gerado)
export const trackAddPaymentInfo = async (value: number, quantity: number, currency = "BRL") => {
  const utm = getAllUTMData()
  const fbq = await waitForFbq()
  if (!fbq) {
    console.warn("[v0] Facebook pixel not loaded: AddPaymentInfo")
    return
  }

  try {
    const data: any = {
      value,
      currency,
      num_items: quantity,
      content_ids: ["titulo-viva-sorte"],
      content_type: "product",
      ...utm,
    }

    console.log("[v0] Facebook Pixel - AddPaymentInfo:", data)
    fbq("track", "AddPaymentInfo", data)
  } catch (e) {
    console.error("[v0] FB Pixel AddPaymentInfo Error:", e)
  }
}

// Venda pendente (PIX gerado, não pago) - APENAS UTMify
export const trackPendingPurchase = async (data: ConversionEventData) => {
  const utm = getAllUTMData()
  const eventData = {
    ...data,
    ...utm,
    status: "pending",
    offer_name: "VIVA SORTE",
  }
  await trackWithUTMify("pendente", eventData)
  console.log("[v0] Venda pendente enviada à UTMify com UTM:", eventData)
}

// Venda aprovada (pagamento confirmado) - UTMify E Facebook
export const trackPurchase = async (data: ConversionEventData) => {
  const utm = getAllUTMData()
  const eventData = {
    ...data,
    ...utm,
    status: "approved",
    offer_name: "VIVA SORTE",
  }
  await trackWithUTMify("purchase", eventData)
  await trackWithFacebook("Purchase", eventData)
  console.log("[v0] Venda aprovada enviada para UTMify e Facebook com UTM:", eventData)
}
