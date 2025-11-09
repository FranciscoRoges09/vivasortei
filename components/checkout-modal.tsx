"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Copy, Check, Shield, Zap, Lock, Plus } from "lucide-react"
import {
  trackLead,
  trackPendingPurchase,
  trackPurchase,
  trackInitiateCheckout,
  trackAddPaymentInfo,
} from "@/lib/tracking-complete"
import {
  getTrackingParameters,
  storeTrackingParameters,
  getAllTrackingData,
  formatTrackingForLogging,
} from "@/lib/utm-utils"
import { copyToClipboard } from "@/utils/copy-to-clipboard"
import { savePurchase } from "@/lib/purchases-management"
import { useRouter } from "next/navigation"

interface OrderBump {
  id: string
  title: string
  description: string
  quantity: number
  originalPrice: number
  discountedPrice: number
  discount: number
  selected: boolean
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  quantity: number
  totalPrice: number
}

export default function CheckoutModal({ isOpen, onClose, quantity, totalPrice }: CheckoutModalProps) {
  const [step, setStep] = useState<"form" | "payment">("form")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [nameError, setNameError] = useState("")
  const [cpfError, setCpfError] = useState("")
  const [error, setError] = useState("")

  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([
    {
      id: "bump1",
      title: "Adicionar Oferta Especial",
      description: "COMPRE + 60 TÍTULOS COM 50% DE DESCONTO",
      quantity: 60,
      originalPrice: 59.7,
      discountedPrice: 29.85,
      discount: 50,
      selected: false,
    },
    {
      id: "bump2",
      title: "Adicionar Oferta Especial",
      description: "COMPRE + 120 TÍTULOS COM 60% DE DESCONTO",
      quantity: 120,
      originalPrice: 118.8,
      discountedPrice: 47.52,
      discount: 60,
      selected: false,
    },
    {
      id: "bump3",
      title: "Adicionar Oferta Especial",
      description: "COMPRE + 30 TÍTULOS COM 40% DE DESCONTO",
      quantity: 30,
      originalPrice: 29.7,
      discountedPrice: 17.82,
      discount: 40,
      selected: false,
    },
  ])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
  })

  const [pixData, setPixData] = useState<{
    code: string
    qrcode_base64: string
    transactionId: string
  } | null>(null)

  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const MAX_AMOUNT = 300.0

  const calculateTotalWithBumps = (): { total: number; bumpTotal: number; totalQuantity: number } => {
    let bumpTotal = 0
    let totalQuantity = quantity

    orderBumps.forEach((bump) => {
      if (bump.selected) {
        bumpTotal += bump.discountedPrice
        totalQuantity += bump.quantity
      }
    })

    return {
      total: totalPrice + bumpTotal,
      bumpTotal,
      totalQuantity,
    }
  }

  const { total: finalTotal, bumpTotal, totalQuantity } = calculateTotalWithBumps()

  const toggleOrderBump = (bumpId: string) => {
    setOrderBumps(orderBumps.map((bump) => (bump.id === bumpId ? { ...bump, selected: !bump.selected } : bump)))
  }

  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
    if (!nameRegex.test(name)) return false

    const nameParts = name.trim().split(/\s+/)
    if (nameParts.length < 2) return false

    return nameParts.every((part) => part.length >= 2)
  }

  const isValidCPF = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, "")

    if (!cleanCpf || cleanCpf.length !== 11) {
      return false
    }

    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false
    }

    let sum = 0
    for (let i = 0; i < 9; i++) {
      const digit = Number.parseInt(cleanCpf[i])
      const multiplier = 10 - i
      sum += digit * multiplier
    }

    let remainder = sum % 11
    const firstDigit = remainder < 2 ? 0 : 11 - remainder
    const firstDigitReceived = Number.parseInt(cleanCpf[9])

    if (firstDigitReceived !== firstDigit) {
      return false
    }

    sum = 0
    for (let i = 0; i < 10; i++) {
      const digit = Number.parseInt(cleanCpf[i])
      const multiplier = 11 - i
      sum += digit * multiplier
    }

    remainder = sum % 11
    const secondDigit = remainder < 2 ? 0 : 11 - remainder
    const secondDigitReceived = Number.parseInt(cleanCpf[10])

    if (secondDigitReceived !== secondDigit) {
      return false
    }

    return true
  }

  const formatCPF = (value: string): string => {
    const cleanValue = value.replace(/\D/g, "")
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    }
    return cleanValue.substring(0, 11)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (error) setError("")

    if (name === "name") {
      const cleanValue = value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "")
      setFormData({ ...formData, [name]: cleanValue })

      if (cleanValue && !validateName(cleanValue)) {
        const nameParts = cleanValue.trim().split(/\s+/)
        if (nameParts.length < 2) {
          setNameError("Informe nome e sobrenome completos")
        } else if (nameParts.some((part) => part.length < 2)) {
          setNameError("Nome e sobrenome devem ter pelo menos 2 letras cada")
        } else {
          setNameError("Use apenas letras, espaços, hífens (-) e apóstrofos (')")
        }
      } else {
        setNameError("")
      }
    } else if (name === "cpf") {
      const formatted = formatCPF(value)
      setFormData({ ...formData, [name]: formatted })

      if (formatted && formatted.replace(/\D/g, "").length === 11 && !isValidCPF(formatted)) {
        setCpfError("CPF inválido. Verifique os dígitos verificadores.")
      } else {
        setCpfError("")
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateName(formData.name)) {
      setError("Informe nome e sobrenome completos")
      return
    }

    if (!formData.email || !formData.email.includes("@")) {
      setError("Email inválido")
      return
    }

    if (!isValidCPF(formData.cpf)) {
      setError("CPF inválido. Verifique os dígitos verificadores.")
      return
    }

    if (finalTotal > MAX_AMOUNT) {
      setError(`Valor máximo permitido: R$ ${MAX_AMOUNT.toFixed(2)}`)
      return
    }

    setLoading(true)
    setError("")

    const trackingData = getTrackingParameters()
    storeTrackingParameters(trackingData)
    console.log("[v0] CHECKOUT: Step 1 - Tracking Parameters captured from URL:", trackingData)
    console.log("[v0] CHECKOUT: Formatted tracking string:", formatTrackingForLogging(trackingData))

    localStorage.setItem(
      "checkout_form_data",
      JSON.stringify({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        cpf: formData.cpf.replace(/\D/g, ""),
      }),
    )

    const utm_source = trackingData.utm_source || ""
    const utm_medium = trackingData.utm_medium || ""
    const utm_campaign = trackingData.utm_campaign || ""
    const utm_content = trackingData.utm_content || ""
    const utm_term = trackingData.utm_term || ""
    const utm_id = trackingData.utm_id || ""
    const ref = trackingData.ref || ""
    const src = trackingData.src || ""
    const sck = trackingData.sck || ""

    console.log("[v0] CHECKOUT: Step 2 - Tracking Lead event")
    await trackLead(formData.email, formData.name)

    console.log("[v0] CHECKOUT: Step 3 - Tracking InitiateCheckout")
    await trackInitiateCheckout(finalTotal, totalQuantity)

    let retryCount = 0
    const maxRetries = 2

    const makeRequest = async () => {
      try {
        const allTrackingData = getAllTrackingData()
        console.log("[v0] CHECKOUT: Step 4 - Getting all stored tracking data:", allTrackingData)

        const payloadWithTracking = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          cpf: formData.cpf.replace(/\D/g, ""),
          quantity: totalQuantity,
          amount: Math.round(finalTotal * 100),
          utm_source: allTrackingData.utm_source || "",
          utm_medium: allTrackingData.utm_medium || "",
          utm_campaign: allTrackingData.utm_campaign || "",
          utm_id: allTrackingData.utm_id || "",
          utm_term: allTrackingData.utm_term || "",
          utm_content: allTrackingData.utm_content || "",
          ref: allTrackingData.ref || "",
          src: allTrackingData.src || "",
          sck: allTrackingData.sck || "",
        }

        console.log("[v0] CHECKOUT: Step 5 - API Payload to send (before request):", {
          ...payloadWithTracking,
          cpf: "***",
          email: "***",
        })

        const response = await fetch("/api/create-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadWithTracking),
        })

        const result = await response.json()

        console.log("[v0] CHECKOUT: Step 6 - API Response Status:", response.status)
        console.log("[v0] CHECKOUT: Step 7 - API Response Data:", result)

        if (!response.ok) {
          if (result.retryable && retryCount < maxRetries) {
            retryCount++
            const delayMs = 1000 * Math.pow(2, retryCount - 1)
            console.log("[v0] CHECKOUT: Retrying in", delayMs, "ms")
            await new Promise((resolve) => setTimeout(resolve, delayMs))
            return makeRequest()
          }

          setError(result.error || "Erro ao criar pagamento PIX")
          setLoading(false)
          return
        }

        if (result.data?.pix?.code && result.data?.pix?.qrcode_base64 && result.data?.id) {
          console.log("[v0] CHECKOUT: Step 8 - PIX generated successfully:", {
            transactionId: result.data.id,
            tracking_received: result.data?.metadata,
          })

          savePurchase({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            cpf: formData.cpf.replace(/\D/g, ""),
            quantity: totalQuantity,
            amount: Math.round(finalTotal * 100),
            status: "pending",
          })

          await trackPendingPurchase({
            value: finalTotal,
            currency: "BRL",
            quantity: totalQuantity,
            transactionId: result.data.id,
            email: formData.email,
            utm_source: allTrackingData.utm_source || "",
            utm_medium: allTrackingData.utm_medium || "",
            utm_campaign: allTrackingData.utm_campaign || "",
            utm_content: allTrackingData.utm_content || "",
            utm_term: allTrackingData.utm_term || "",
          })

          setPixData({
            code: result.data.pix.code,
            qrcode_base64: result.data.pix.qrcode_base64,
            transactionId: result.data.id,
          })

          console.log("[v0] CHECKOUT: Step 9 - Tracking AddPaymentInfo")
          await trackAddPaymentInfo(finalTotal, totalQuantity)

          setStep("payment")
        } else {
          console.error("[v0] CHECKOUT: Invalid response structure:", result)
          setError("Resposta inválida do servidor")
        }
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++
          const delayMs = 1000 * Math.pow(2, retryCount - 1)
          console.log("[v0] CHECKOUT: Error, retrying in", delayMs, "ms:", err)
          await new Promise((resolve) => setTimeout(resolve, delayMs))
          return makeRequest()
        }

        console.error("[v0] CHECKOUT: Final error:", err)
        setError("Erro ao processar pagamento. Tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    makeRequest()
  }

  const startPaymentVerification = async () => {
    if (!pixData?.transactionId || paymentVerified) return

    setVerifying(true)

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/verify-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionId: pixData.transactionId }),
        })

        const result = await response.json()

        if (result.isPaid) {
          setPaymentVerified(true)
          const allTrackingData = getAllTrackingData()

          await trackPurchase({
            value: finalTotal,
            currency: "BRL",
            quantity: totalQuantity,
            transactionId: pixData.transactionId,
            email: formData.email,
            utm_source: allTrackingData.utm_source || "",
            utm_medium: allTrackingData.utm_medium || "",
            utm_campaign: allTrackingData.utm_campaign || "",
            utm_content: allTrackingData.utm_content || "",
            utm_term: allTrackingData.utm_term || "",
          })

          // Auto-redirect to upsell after 2 seconds
          setTimeout(() => {
            handleClose()
            window.location.href = "/upsell"
          }, 2000)
        }
      } catch (err) {
        console.error("[v0] Payment verification error:", err)
      }
    }

    const interval = setInterval(() => {
      verifyPayment()
    }, 5000)

    // Initial check
    await verifyPayment()

    return () => clearInterval(interval)
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

  const router = useRouter()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-2xl gap-0 p-0 overflow-hidden rounded-2xl"
        aria-describedby="checkout-dialog-description"
      >
        <DialogTitle className="sr-only">Checkout de Compra</DialogTitle>

        <span id="checkout-dialog-description" className="sr-only">
          Formulário de checkout para compra de títulos Viva Sorte com pagamento via PIX
        </span>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">
                {step === "form" ? "Checkout Seguro" : paymentVerified ? "Pagamento Aprovado!" : "Aguardando Pagamento"}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {step === "form"
                  ? "Complete seus dados para continuar"
                  : paymentVerified
                    ? "Redirecionando..."
                    : "Escaneie ou copie o código PIX"}
              </p>
            </div>
            <div className="flex gap-2">
              <div className={`w-2 h-2 rounded-full ${step === "form" ? "bg-white" : "bg-blue-300"}`} />
              <div className={`w-2 h-2 rounded-full ${step === "payment" ? "bg-white" : "bg-blue-300"}`} />
            </div>
          </div>
        </div>

        <div className="px-6 py-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-2 h-11"
                  />
                  {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-sm font-semibold text-gray-700">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    disabled={loading}
                    maxLength={14}
                    className="mt-2 h-11"
                  />
                  {cpfError && <p className="mt-1 text-xs text-red-600">{cpfError}</p>}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-3">Resumo do Pedido</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-800">Quantidade:</span>
                    <span className="font-semibold text-blue-900">{quantity} títulos</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-800">Preço unitário:</span>
                    <span className="font-semibold text-blue-900">R$ 0,99</span>
                  </div>
                </div>
                <div className="h-px bg-blue-200 my-4" />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-blue-900">Subtotal:</span>
                  <span className="font-bold text-blue-700 text-xl">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Ofertas Especiais</p>
                {orderBumps.map((bump) => (
                  <div
                    key={bump.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      bump.selected ? "border-blue-500 bg-blue-50" : "border-blue-200 bg-white hover:border-blue-300"
                    }`}
                    onClick={() => toggleOrderBump(bump.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                          bump.selected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                        }`}
                      >
                        {bump.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-800">{bump.title}</h4>
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">
                            -{bump.discount}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{bump.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">De</span>
                          <span className="text-sm text-gray-500 line-through">R$ {bump.originalPrice.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">por</span>
                          <span className="text-lg font-bold text-blue-600">R$ {bump.discountedPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <Plus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>

              {bumpTotal > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-800">Subtotal:</span>
                      <span className="font-semibold text-green-900">R$ {totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-800">Ofertas Adicionadas:</span>
                      <span className="font-semibold text-green-900">+ R$ {bumpTotal.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-green-300 my-3" />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-green-900">Total:</span>
                      <span className="font-black text-green-700 text-2xl">R$ {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Seguro</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Confiável</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-700">Rápido</span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-800">{error}</div>
              )}

              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.email || !formData.cpf}
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  "Gerar PIX"
                )}
              </Button>
            </form>
          ) : pixData ? (
            <div className="space-y-6">
              {paymentVerified ? (
                <div className="text-center py-12">
                  <div className="mb-6 flex justify-center">
                    <div className="inline-block">
                      <Check className="w-24 h-24 text-green-500 animate-bounce" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Aprovado!</h2>
                  <p className="text-gray-600 text-lg">Redirecionando para a próxima página...</p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-gray-600 font-medium mb-2">Escaneie com seu app de banco</p>
                    <p className="text-sm text-gray-500">Use qualquer app bancário que aceita PIX</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 shadow-lg">
                      <img
                        src={`data:image/png;base64,${pixData.qrcode_base64}`}
                        alt="QR Code PIX"
                        width={256}
                        height={256}
                        className="h-64 w-64"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 block">Ou copie o código PIX:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pixData.code}
                        readOnly
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={copyPixCode}
                        className="h-12 w-12 p-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
                      >
                        {copied ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5 text-blue-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">Pagamento realizado?</span> Aguarde confirmação em sua conta.
                    </p>
                  </div>

                  <Button
                    onClick={startPaymentVerification}
                    disabled={verifying}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar Pagamento"
                    )}
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )

  function handleClose() {
    setFormData({ name: "", email: "", cpf: "" })
    setPixData(null)
    setStep("form")
    setError("")
    setNameError("")
    setCpfError("")
    setPaymentVerified(false)
    setVerifying(false)
    setOrderBumps(orderBumps.map((bump) => ({ ...bump, selected: false })))
    onClose()
  }
}
