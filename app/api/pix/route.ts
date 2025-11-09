import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.BUCKPAY_API_URL
    const apiKey = process.env.BUCKPAY_API_KEY
    const userAgent = process.env.BUCKPAY_USER_AGENT || "Buckpay API"

    if (!apiUrl || !apiKey) {
      console.error("[PIX-DEBUG] ❌ Variáveis de ambiente ausentes")
      return NextResponse.json({ error: "Erro ao gerar PIX, tente novamente mais tarde." }, { status: 500 })
    }

    // Recebe o body do cliente
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
    }

    const { nome, email, cpf, amount } = body

    if (!nome || !email || !cpf || !amount) {
      console.error("[PIX-DEBUG] Campos obrigatórios ausentes:", { nome, email, cpf, amount })
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 })
    }

    // Monta o payload do PIX
    const payload = {
      externalId: `pedido-${Date.now()}`,
      amount,
      buyerName: nome,
      buyerEmail: email,
      buyerCpf: cpf,
    }

    console.log("[PIX-DEBUG] 🔄 Enviando payload:", payload)

    // Faz a requisição para a BuckPay API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `key=${apiKey}`, // 🔑 formato correto
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[PIX-DEBUG] 📩 Resposta BuckPay:", response.status, responseText)

    // Caso resposta seja JSON válida
    let data: any = {}
    try {
      data = JSON.parse(responseText)
    } catch {
      console.warn("[PIX-DEBUG] ⚠️ Resposta não-JSON recebida.")
    }

    if (!response.ok) {
      console.error("[PIX-DEBUG] ❌ Erro na API BuckPay:", data)
      return NextResponse.json(
        { error: data?.message || "Erro ao gerar PIX, tente novamente mais tarde." },
        { status: response.status },
      )
    }

    // ✅ Sucesso
    return NextResponse.json({
      success: true,
      pix: data,
    })
  } catch (error) {
    console.error("[PIX-DEBUG] 💥 Erro na rota:", error)
    return NextResponse.json({ error: "Erro ao gerar PIX, tente novamente mais tarde." }, { status: 500 })
  }
}
