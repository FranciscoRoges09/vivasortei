export function logPayloadSafely(payload: any): any {
  if (!payload) return null

  return {
    externalId: payload.external_id?.substring(0, 20) + "...",
    amount: payload.amount,
    quantity: payload.offer?.quantity,
    buyerNamePrefix: payload.buyer?.name?.charAt(0) + "*".repeat(Math.max(0, (payload.buyer?.name?.length || 0) - 2)),
  }
}

export function logErrorSafely(error: any): any {
  return {
    status: error?.status,
    message: error?.message || "Unknown error",
    hasErrorDetail: !!error?.detail,
  }
}
