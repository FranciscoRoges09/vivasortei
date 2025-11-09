"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, ShoppingCart, X, Clock, Copy, Check } from "lucide-react"
import { getCompletedUserPurchases, getPendingUserPurchases } from "@/lib/purchases-management"
import HeaderMenu from "@/components/header-menu"
import { copyToClipboard } from "@/utils/copy-to-clipboard"

interface Purchase {
  id: string
  email: string
  quantity: number
  amount: number
  name: string
  cpf: string
  date: string
  status: "pending" | "completed" | "failed"
}

export default function DashboardLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"email" | "select">("email")
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [error, setError] = useState("")
  const [showNoPurchasesModal, setShowNoPurchasesModal] = useState(false)
  const [attemptedEmail, setAttemptedEmail] = useState("")
  const [showPendingPaymentModal, setShowPendingPaymentModal] = useState(false)
  const [pendingPurchase, setPendingPurchase] = useState<Purchase | null>(null)

  const [pixData, setPixData] = useState<{ code: string; qrcode_base64: string; transactionId: string } | null>(null)
  const [verifyingPix, setVerifyingPix] = useState(false)
  const [pixVerified, setPixVerified] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setError("Email inválido")
      return
    }

    setLoading(true)
    setError("")

    setTimeout(() => {
      const completedPurchases = getCompletedUserPurchases(email)
      const pendingPurchases = getPendingUserPurchases(email)

      if (completedPurchases.length > 0) {
        setPurchases(completedPurchases)
        setStep("select")
        setLoading(false)
        return
      }

      if (pendingPurchases.length > 0) {
        setAttemptedEmail(email)
        setPendingPurchase(pendingPurchases[0])
        generatePixForPendingPurchase(pendingPurchases[0], email)
        setLoading(false)
        return
      }

      setAttemptedEmail(email)
      setShowNoPurchasesModal(true)
      setLoading(false)
    }, 1000)
  }

  const generatePixForPendingPurchase = async (purchase: Purchase, userEmail: string) => {
    try {
      const payloadWithTracking = {
        name: purchase.name,
        email: userEmail,
        cpf: purchase.cpf,
        quantity: purchase.quantity,
        amount: purchase.amount,
      }

      const response = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithTracking),
      })

      const result = await response.json()

      if (result.data?.pix?.code && result.data?.pix?.qrcode_base64) {
        setPixData({
          code: result.data.pix.code,
          qrcode_base64: result.data.pix.qrcode_base64,
          transactionId: result.data.id,
        })
        setShowPendingPaymentModal(true)
      }
    } catch (err) {
      console.error("[v0] Error generating PIX:", err)
      setError("Erro ao gerar PIX")
    }
  }

  const handleSelectPurchase = (purchase: Purchase) => {
    sessionStorage.setItem(
      "logged_in_user",
      JSON.stringify({
        email: purchase.email,
        name: purchase.name,
        purchaseId: purchase.id,
      }),
    )

    router.push("/dashboard")
  }

  const handleBack = () => {
    if (step === "select") {
      setStep("email")
      setEmail("")
      setPurchases([])
      setError("")
    } else {
      router.push("/")
    }
  }

  const handleGoToCheckout = () => {
    setShowNoPurchasesModal(false)
    sessionStorage.setItem("checkout_email", attemptedEmail)
    router.push("/?scroll=checkout")
  }

  const verifyPendingPayment = async () => {
    if (!pixData?.transactionId) return

    setVerifyingPix(true)

    try {
      const response = await fetch("/api/verify-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: pixData.transactionId }),
      })

      const result = await response.json()

      if (result.isPaid) {
        setPixVerified(true)
        // Auto-close and redirect after 2 seconds
        setTimeout(() => {
          setShowPendingPaymentModal(false)
          handleSelectPurchase(pendingPurchase!)
        }, 2000)
      }
    } catch (err) {
      console.error("[v0] Payment verification error:", err)
    } finally {
      setVerifyingPix(false)
    }
  }

  const copyPixCode = async () => {
    if (pixData?.code) {
      const success = await copyToClipboard(pixData.code)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

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
        <div className="w-full max-w-md">
          {step === "email" ? (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 text-5xl">🔑</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Acessar sua Conta</h1>
                <p className="text-gray-600 text-sm sm:text-base">Digite seu email para visualizar suas compras</p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    disabled={loading}
                    className="mt-2 h-11"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={handleBack} className="w-full h-11 bg-transparent">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-900">
                  <span className="font-semibold">Acesso:</span> Apenas emails com compras confirmadas podem acessar o
                  dashboard. Realize uma compra primeiro.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 text-5xl">📋</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Suas Compras</h1>
                <p className="text-gray-600 text-sm sm:text-base">Selecione uma compra para ver seus títulos</p>
              </div>

              <div className="space-y-3">
                {purchases.map((purchase) => (
                  <button
                    key={purchase.id}
                    onClick={() => handleSelectPurchase(purchase)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{purchase.quantity} Títulos</p>
                        <p className="text-sm text-gray-600">R$ {(purchase.amount / 100).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(purchase.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={handleBack} className="w-full h-11 mt-6 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 px-4 text-center text-xs sm:text-sm text-gray-600">
        <p>Acesso seguro a sua conta</p>
      </footer>

      {showPendingPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div
              className={`${pixVerified ? "bg-gradient-to-r from-green-600 to-green-700" : "bg-gradient-to-r from-yellow-600 to-yellow-700"} p-6 text-white text-center relative`}
            >
              <button
                onClick={() => {
                  setShowPendingPaymentModal(false)
                  setPixData(null)
                  setPixVerified(false)
                }}
                className="absolute top-4 right-4 p-2 hover:bg-yellow-700/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mb-3 text-4xl">{pixVerified ? "✓" : "⏳"}</div>
              <h2 className="text-2xl font-bold">{pixVerified ? "Pagamento Aprovado!" : "Pagamento Pendente"}</h2>
            </div>

            <div className="p-6 space-y-4">
              {pixVerified ? (
                <div className="text-center py-6">
                  <p className="text-gray-700 mb-2">Sua compra foi confirmada!</p>
                  <p className="text-sm text-gray-600">Redirecionando para seus títulos...</p>
                </div>
              ) : pixData ? (
                <>
                  <p className="text-gray-700 text-center">
                    Complete o pagamento de R$ {pendingPurchase ? (pendingPurchase.amount / 100).toFixed(2) : "0,00"}
                  </p>

                  <div className="flex justify-center">
                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                      <img
                        src={`data:image/png;base64,${pixData.qrcode_base64}`}
                        alt="QR Code PIX"
                        width={200}
                        height={200}
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 block">Código PIX (Copia e Cola):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pixData.code}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyPixCode}
                        className="px-3 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-yellow-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="font-semibold text-yellow-900">Detalhes da Compra Pendente:</p>
                    </div>
                    <div className="space-y-1 text-sm text-yellow-900">
                      <div className="flex justify-between">
                        <span>Títulos:</span>
                        <span className="font-bold">{pendingPurchase?.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor:</span>
                        <span className="font-bold">
                          R$ {pendingPurchase ? (pendingPurchase.amount / 100).toFixed(2) : "0,00"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                    <p className="font-semibold mb-1">Próximos passos:</p>
                    <ol className="text-xs list-decimal list-inside space-y-1">
                      <li>Abra seu app de banco</li>
                      <li>Escaneie o QR code ou copie o código</li>
                      <li>Confirme o pagamento</li>
                      <li>Clique em "Verificar Pagamento"</li>
                    </ol>
                  </div>
                </>
              ) : null}
            </div>

            {!pixVerified && (
              <div className="bg-gray-50 p-6 flex gap-3 border-t">
                <button
                  onClick={() => {
                    setShowPendingPaymentModal(false)
                    setPixData(null)
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={verifyPendingPayment}
                  disabled={verifyingPix}
                  className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
                >
                  {verifyingPix ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      Verificar Pagamento
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showNoPurchasesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center relative">
              <button
                onClick={() => setShowNoPurchasesModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-blue-700/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mb-3 text-4xl">🛍️</div>
              <h2 className="text-2xl font-bold">Nenhuma Compra Encontrada</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-center">
                Seu email <span className="font-semibold">{attemptedEmail}</span> não possui compras associadas.
              </p>
              <p className="text-gray-600 text-center text-sm">
                Para acessar seus títulos e cotas, você precisa realizar uma compra primeiro.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-1">Como funciona:</p>
                <ul className="space-y-1 text-xs list-disc list-inside">
                  <li>Realize uma compra através da página inicial</li>
                  <li>Use o mesmo email nesta página</li>
                  <li>Acesse seus títulos e cotas no dashboard</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => setShowNoPurchasesModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleGoToCheckout}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Comprar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
