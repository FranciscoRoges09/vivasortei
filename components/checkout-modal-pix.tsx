"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CheckoutModalPixProps {
  isOpen: boolean
  onClose: () => void
  amount: number
}

export default function CheckoutModalPix({ isOpen, onClose, amount }: CheckoutModalPixProps) {
  const [step, setStep] = useState<"form" | "payment">("form")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
  })

  const [pixData, setPixData] = useState<any>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.nome || !formData.email || !formData.cpf) {
      setError("Preencha todos os campos")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
          amount,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Erro ao criar pagamento PIX")
        setLoading(false)
        return
      }

      setPixData(result)
      setStep("payment")
    } catch (err) {
      setError("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (pixData?.qrcode) {
      await navigator.clipboard.writeText(pixData.qrcode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setFormData({ nome: "", email: "", cpf: "" })
    setPixData(null)
    setStep("form")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-gray-200 px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            {step === "form" ? "Checkout PIX" : "Pagamento PIX"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6">
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Seu Nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
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
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  name="cpf"
                  type="text"
                  placeholder="12345678900"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Valor</p>
                <p className="mt-1 text-lg font-semibold text-blue-900">R$ {(amount / 100).toFixed(2)}</p>
              </div>

              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}

              <Button
                type="submit"
                disabled={loading || !formData.nome || !formData.email || !formData.cpf}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">Escaneie o código abaixo</p>
              <div className="flex justify-center">
                <img src={pixData.qrcode || "/placeholder.svg"} alt="QR Code PIX" className="h-64 w-64" />
              </div>
              <Button onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
