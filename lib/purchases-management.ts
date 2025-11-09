export interface Purchase {
  id: string
  email: string
  quantity: number
  amount: number
  name: string
  cpf: string
  date: string
  status: "pending" | "completed" | "failed"
}

export interface UserDashboardData {
  email: string
  purchases: Purchase[]
}

/**
 * Simulates fetching user purchases based on email
 * In a real app, this would query a database
 */
export function getUserPurchases(email: string): Purchase[] {
  if (typeof window === "undefined") return []

  const allPurchases = localStorage.getItem("all_purchases")
  if (!allPurchases) return []

  try {
    const purchases: Purchase[] = JSON.parse(allPurchases)
    return purchases.filter((p) => p.email.toLowerCase() === email.toLowerCase())
  } catch {
    return []
  }
}

/**
 * Saves a new purchase to localStorage
 */
export function savePurchase(purchase: Omit<Purchase, "id" | "date">): void {
  if (typeof window === "undefined") return

  const allPurchases = localStorage.getItem("all_purchases")
  let purchases: Purchase[] = []

  if (allPurchases) {
    try {
      purchases = JSON.parse(allPurchases)
    } catch {
      purchases = []
    }
  }

  const newPurchase: Purchase = {
    ...purchase,
    id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
  }

  purchases.push(newPurchase)
  localStorage.setItem("all_purchases", JSON.stringify(purchases))
}

/**
 * Generates random quota tickets for a purchase
 */
export function generateQuotas(quantity: number): string[] {
  const quotas: string[] = []
  const usedNumbers = new Set<string>()

  while (quotas.length < quantity) {
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const formatted = `${randomNum.slice(0, 3)}.${randomNum.slice(3, 6)}`

    if (!usedNumbers.has(formatted)) {
      usedNumbers.add(formatted)
      quotas.push(formatted)
    }
  }

  return quotas
}

/**
 * Get cached quotas for a purchase or generate new ones
 */
export function getOrGenerateQuotas(purchaseId: string, quantity: number): string[] {
  if (typeof window === "undefined") return []

  const cached = localStorage.getItem(`quotas_${purchaseId}`)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // Fall through to generate new ones
    }
  }

  const quotas = generateQuotas(quantity)
  localStorage.setItem(`quotas_${purchaseId}`, JSON.stringify(quotas))
  return quotas
}

/**
 * Add function to update purchase status after payment confirmation
 */
export function updatePurchaseStatus(purchaseId: string, newStatus: "pending" | "completed" | "failed"): void {
  if (typeof window === "undefined") return

  const allPurchases = localStorage.getItem("all_purchases")
  if (!allPurchases) return

  try {
    const purchases: Purchase[] = JSON.parse(allPurchases)
    const purchaseIndex = purchases.findIndex((p) => p.id === purchaseId)

    if (purchaseIndex !== -1) {
      purchases[purchaseIndex].status = newStatus
      localStorage.setItem("all_purchases", JSON.stringify(purchases))
      console.log(`[v0] Purchase ${purchaseId} status updated to ${newStatus}`)
    }
  } catch {
    console.error("[v0] Error updating purchase status")
  }
}

/**
 * Get only completed purchases for a user
 */
export function getCompletedUserPurchases(email: string): Purchase[] {
  if (typeof window === "undefined") return []

  const allPurchases = localStorage.getItem("all_purchases")
  if (!allPurchases) return []

  try {
    const purchases: Purchase[] = JSON.parse(allPurchases)
    return purchases.filter((p) => p.email.toLowerCase() === email.toLowerCase() && p.status === "completed")
  } catch {
    return []
  }
}

/**
 * Get pending purchases for a user
 */
export function getPendingUserPurchases(email: string): Purchase[] {
  if (typeof window === "undefined") return []

  const allPurchases = localStorage.getItem("all_purchases")
  if (!allPurchases) return []

  try {
    const purchases: Purchase[] = JSON.parse(allPurchases)
    return purchases.filter((p) => p.email.toLowerCase() === email.toLowerCase() && p.status === "pending")
  } catch {
    return []
  }
}
