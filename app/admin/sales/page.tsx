"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import type { Purchase } from "@/lib/purchases-management"

export default function AdminSalesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const allPurchases = localStorage.getItem("all_purchases")
        if (allPurchases) {
          const parsed: Purchase[] = JSON.parse(allPurchases)
          setPurchases(parsed)
        }
      } catch (err) {
        console.error("Error loading purchases:", err)
      }
    }
  }, [isAuthenticated])

  const handleLogin = () => {
    // Simple authentication - you can change this password
    const correctPassword = "admin123"
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Senha incorreta")
      setPasswordInput("")
    }
  }

  const totalSales = purchases.reduce((sum, p) => sum + p.amount / 100, 0)
  const totalCustomers = new Set(purchases.map((p) => p.email.toLowerCase())).size
  const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Painel Admin - Vendas</CardTitle>
            <CardDescription>Digite a senha para acessar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Senha"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="h-10"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Painel de Vendas</h1>
              <p className="text-slate-600 mt-1">Todas as compras e clientes</p>
            </div>
            <Button
              onClick={() => {
                setIsAuthenticated(false)
                setPasswordInput("")
                setPurchases([])
              }}
              variant="outline"
            >
              Sair
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">Total de Vendas</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">R$ {totalSales.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">Clientes</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{totalCustomers}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">Total de Compras</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{purchases.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-slate-600 text-sm font-medium">Total de Títulos</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{totalQuantity}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Compras</CardTitle>
            <CardDescription>
              {purchases.length === 0 ? "Nenhuma compra registrada" : `${purchases.length} compra(s) registrada(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhuma compra ainda. As vendas aparecerão aqui automaticamente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">CPF</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Títulos</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-700">Valor</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Data</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-slate-900 font-medium">{purchase.email}</td>
                        <td className="py-3 px-4 text-slate-700">{purchase.name}</td>
                        <td className="py-3 px-4 text-slate-700">{purchase.cpf}</td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-900">{purchase.quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          R$ {(purchase.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {new Date(purchase.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              purchase.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : purchase.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {purchase.status === "completed" && "Concluído"}
                            {purchase.status === "pending" && "Pendente"}
                            {purchase.status === "failed" && "Falhou"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="mt-6 flex gap-2">
          <Button
            onClick={() => {
              const csv = [
                ["Email", "Nome", "CPF", "Títulos", "Valor (R$)", "Data", "Status"],
                ...purchases.map((p) => [
                  p.email,
                  p.name,
                  p.cpf,
                  p.quantity,
                  (p.amount / 100).toFixed(2),
                  new Date(p.date).toLocaleDateString("pt-BR"),
                  p.status,
                ]),
              ]
                .map((row) => row.join(","))
                .join("\n")

              const blob = new Blob([csv], { type: "text/csv" })
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `vendas_${new Date().toISOString().split("T")[0]}.csv`
              a.click()
              window.URL.revokeObjectURL(url)
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            Exportar para CSV
          </Button>
          <Link href="/">
            <Button variant="outline">Voltar para Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
