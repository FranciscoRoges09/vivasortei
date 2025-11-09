import { type NextRequest, NextResponse } from "next/server"

function isValidCPF(cpf: string): boolean {
  if (!cpf || cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cpf[i]) * (10 - i)
  }
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  if (Number.parseInt(cpf[9]) !== firstDigit) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cpf[i]) * (11 - i)
  }
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  if (Number.parseInt(cpf[10]) !== secondDigit) return false

  return true
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.BUCKPAY_API_URL
    const apiKey = process.env.BUCKPAY_API_KEY
    const userAgent = process.env.BUCKPAY_USER_AGENT || "Buckpay API"

    if (!apiUrl || !apiKey) {
      console.error("[PIX] Missing environment variables: BUCKPAY_API_URL or BUCKPAY_API_KEY")
      return NextResponse.json(
        { error: "Erro ao processar pagamento. Tente novamente em alguns minutos." },
        { status: 500 },
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
    }

    const { name, email, cpf, quantity, amount } = body

    const utm_source = body.utm_source || null
    const utm_medium = body.utm_medium || null
    const utm_campaign = body.utm_campaign || null
    const utm_id = body.utm_id || null
    const utm_term = body.utm_term || null
    const utm_content = body.utm_content || null
    const ref = body.ref || null
    const src = body.src || null
    const sck = body.sck || null

    console.log("[PIX] Incoming tracking data:", {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_id,
      utm_term,
      utm_content,
      ref,
      src,
      sck,
    })

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 })
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    if (!cpf || typeof cpf !== "string" || cpf.replace(/\D/g, "").length !== 11) {
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 })
    }

    const cleanCpf = cpf.replace(/\D/g, "")
    if (!isValidCPF(cleanCpf)) {
      return NextResponse.json({ error: "CPF inválido. Verifique os dígitos verificadores." }, { status: 400 })
    }

    if (quantity === undefined || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 })
    }

    if (amount === undefined || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 })
    }

    const amountInCents = Math.round(amount)

    if (amountInCents > 300000) {
      return NextResponse.json({ error: "Valor máximo: R$ 3.000,00" }, { status: 400 })
    }

    const tracking: any = {
      ref: ref || "",
      src: src || "",
      sck: sck || "",
      utm_source: utm_source || "",
      utm_medium: utm_medium || "",
      utm_campaign: utm_campaign || "",
      utm_id: utm_id || "",
      utm_term: utm_term || "",
      utm_content: utm_content || "",
    }

    const payload: any = {
      external_id: `viva-sorte-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payment_method: "pix",
      amount: amountInCents,
      description: "VIVA SORTE",
      buyer: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        document: cleanCpf,
      },
      tracking: tracking,
      metadata: {
        utm_source: utm_source || "",
        utm_medium: utm_medium || "",
        utm_campaign: utm_campaign || "",
        utm_id: utm_id || "",
        utm_term: utm_term || "",
        utm_content: utm_content || "",
        ref: ref || "",
        src: src || "",
        sck: sck || "",
        quantity,
      },
    }

    console.log("[PIX] Sending request to BuckPay")
    console.log("[PIX] Endpoint:", apiUrl)
    console.log(
      "[PIX] Payload:",
      JSON.stringify({
        ...payload,
        buyer: {
          ...payload.buyer,
          document: "***",
        },
      }),
    )

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "user-agent": userAgent,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[PIX] Response status:", response.status)
    console.log("[PIX] Response body:", responseText)

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : {}
    } catch {
      console.error("[PIX] Failed to parse response as JSON")
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      console.error("[PIX] API error:", responseData)
      return NextResponse.json(
        {
          error: "Erro ao gerar PIX. Tente novamente em alguns minutos.",
          retryable: response.status >= 500,
        },
        { status: response.status },
      )
    }

    if (!responseData.data?.pix?.code || !responseData.data?.pix?.qrcode_base64) {
      console.error("[PIX] Invalid response structure:", responseData)
      return NextResponse.json({ error: "Resposta inválida do servidor." }, { status: 502 })
    }

    console.log("[PIX] Success - PIX generated with complete tracking")
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("[PIX] Unexpected error:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Erro ao processar pagamento. Tente novamente." }, { status: 500 })
  }
}
