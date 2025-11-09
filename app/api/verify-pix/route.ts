import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.BUCKPAY_API_URL
    const apiKey = process.env.BUCKPAY_API_KEY
    const userAgent = process.env.BUCKPAY_USER_AGENT || "Buckpay API"

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "Erro ao verificar pagamento." }, { status: 500 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
    }

    const { transactionId } = body

    if (!transactionId || typeof transactionId !== "string") {
      return NextResponse.json({ error: "ID de transação inválido." }, { status: 400 })
    }

    const verifyUrl = `${apiUrl}/${transactionId}`

    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "user-agent": userAgent,
      },
    })

    const responseText = await response.text()
    console.log("[PIX VERIFY] Response status:", response.status)
    console.log("[PIX VERIFY] Transaction ID:", transactionId)

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch {
      console.error("[PIX VERIFY] Failed to parse response as JSON")
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      console.error("[PIX VERIFY] API error:", responseData)
      return NextResponse.json({ error: "Erro ao verificar pagamento.", isPaid: false }, { status: response.status })
    }

    const isPaid = responseData.data?.status === "paid" || responseData.data?.status === "confirmed"
    const metadata = responseData.data?.metadata

    console.log("[PIX VERIFY] Payment status:", responseData.data?.status, "- Paid:", isPaid)
    if (metadata) {
      console.log("[PIX VERIFY] Tracking data from metadata:", {
        utm_source: metadata.utm_source,
        utm_campaign: metadata.utm_campaign,
        utm_medium: metadata.utm_medium,
        utm_content: metadata.utm_content,
        utm_term: metadata.utm_term,
      })
    }

    return NextResponse.json({
      isPaid,
      status: responseData.data?.status,
      data: responseData,
    })
  } catch (error) {
    console.error("[PIX VERIFY] Unexpected error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Erro ao verificar pagamento.", isPaid: false }, { status: 500 })
  }
}
