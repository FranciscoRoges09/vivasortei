"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LogOut, Home, Copy, Check } from "lucide-react"
import { getOrGenerateQuotas } from "@/lib/purchases-management"
import HeaderMenu from "@/components/header-menu"

interface User {
  email: string
  name?: string
  purchaseId?: string
}

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

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [quotas, setQuotas] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = sessionStorage.getItem("logged_in_user")
    if (!storedUser) {
      router.push("/dashboard/login")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)

      // Get purchase from localStorage
      const allPurchases = localStorage.getItem("all_purchases")
      if (allPurchases) {
        const purchases: Purchase[] = JSON.parse(allPurchases)
        const userPurchase = purchases.find(
          (p) => p.email.toLowerCase() === parsedUser.email.toLowerCase() && p.id === parsedUser.purchaseId,
        )

        if (userPurchase && userPurchase.status === "completed") {
          setPurchase(userPurchase)
          const generatedQuotas = getOrGenerateQuotas(userPurchase.id, userPurchase.quantity)
          setQuotas(generatedQuotas)
        } else if (userPurchase && userPurchase.status === "pending") {
          // If purchase is still pending, redirect to verification
          router.push("/verification")
          return
        } else {
          // Purchase not found or invalid
          router.push("/dashboard/login")
          return
        }
      } else {
        router.push("/dashboard/login")
        return
      }

      setIsLoading(false)
    } catch (e) {
      console.error("Error loading user data:", e)
      router.push("/dashboard/login")
    }
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem("logged_in_user")
    router.push("/")
  }

  const handleCopyQuota = async (quota: string, index: number) => {
    try {
      await navigator.clipboard.writeText(quota)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || !purchase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar dados</p>
          <Button onClick={() => router.push("/dashboard/login")}>Voltar ao Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="bg-white p-3 sm:p-4 flex items-center justify-between border-b sticky top-0 z-10 shadow-sm">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ODx1rLRAaDQT-aVUCbVbgZTqf4v0e275UDVm8V0hdRA.png"
          alt="Viva Sorte Logo"
          width={160}
          height={45}
          className="h-6 sm:h-10 w-auto"
        />
        <HeaderMenu />
      </header>

      <main className="flex-1 px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-xl flex gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Pagamento Confirmado!</p>
              <p className="text-sm text-green-800">Você tem acesso completo aos seus títulos.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border-2 border-blue-100 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Bem-vindo!</h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Títulos</p>
                <p className="text-2xl font-bold text-blue-600">{purchase.quantity}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Data da Compra</p>
                <p className="text-lg font-semibold text-green-700">
                  {new Date(purchase.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border-2 border-green-100">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Seus Títulos (Cotas)</h2>
              <p className="text-gray-600 text-sm">
                Você possui {quotas.length} títulos. Clique para copiar o número da cota.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {quotas.map((quota, index) => (
                <button
                  key={index}
                  onClick={() => handleCopyQuota(quota, index)}
                  className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all group"
                >
                  <div className="text-center">
                    <p className="font-mono font-bold text-lg text-gray-900 mb-2">{quota}</p>
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-green-600 mx-auto" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 mx-auto group-hover:text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">💡 Dica:</span> Quanto mais títulos você tiver, maiores são suas chances
                de ganhar!
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={() => router.push("/")}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Home className="w-4 h-4 mr-2" />
              Comprar Mais Títulos
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 px-4 text-center text-xs sm:text-sm text-gray-600">
        <p>Dashboard Seguro - Todos os dados são criptografados</p>
      </footer>
    </div>
  )
}
