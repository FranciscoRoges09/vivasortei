"use client"

import type React from "react"
import HeaderMenu from "@/components/header-menu"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Plus, ShoppingCart, Star } from "lucide-react"
import Image from "next/image"
import CheckoutModal from "@/components/checkout-modal"
import { trackViewContent, trackAddToCart } from "@/lib/facebook-pixel"
import { getUTMParameters, storeUTMParameters } from "@/lib/utm-utils"

export default function VivaSortePage() {
  const [quantity, setQuantity] = useState(40)
  const [selectedQuantity, setSelectedQuantity] = useState(40)
  const pricePerTicket = 0.99
  const minQuantity = 20
  const maxQuantity = 300
  const [daysUntilSunday, setDaysUntilSunday] = useState(0)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  useEffect(() => {
    const calculateDaysUntilSunday = () => {
      const today = new Date()
      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      const daysUntil = currentDay === 0 ? 7 : 7 - currentDay
      setDaysUntilSunday(daysUntil)
    }

    calculateDaysUntilSunday()

    const utm = getUTMParameters()
    if (Object.keys(utm).length > 0) {
      storeUTMParameters(utm)
      console.log("[v0] UTM Parameters captured and stored on page load:", utm)
    }

    trackViewContent("titulo-viva-sorte", "Viva Sorte - Títulos de Sorteio")
  }, [])

  const handleQuantitySelect = (qty: number) => {
    setSelectedQuantity(qty)
    setQuantity(qty)
    const totalPrice = (qty * pricePerTicket).toFixed(2)
    trackAddToCart(Number.parseFloat(totalPrice), qty)
  }

  const handleDecrease = () => {
    if (quantity > minQuantity) {
      const newQty = quantity - 1
      setQuantity(newQty)
      setSelectedQuantity(0)
      const totalPrice = (newQty * pricePerTicket).toFixed(2)
      trackAddToCart(Number.parseFloat(totalPrice), newQty)
    }
  }

  const handleIncrease = () => {
    if (quantity + 10 <= maxQuantity) {
      const newQty = quantity + 10
      setQuantity(newQty)
      setSelectedQuantity(0)
      const totalPrice = (newQty * pricePerTicket).toFixed(2)
      trackAddToCart(Number.parseFloat(totalPrice), newQty)
    } else if (quantity < maxQuantity) {
      const newQty = maxQuantity
      setQuantity(newQty)
      setSelectedQuantity(0)
      const totalPrice = (newQty * pricePerTicket).toFixed(2)
      trackAddToCart(Number.parseFloat(totalPrice), newQty)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value >= minQuantity && value <= maxQuantity) {
      setQuantity(value)
      setSelectedQuantity(0)
      const totalPrice = (value * pricePerTicket).toFixed(2)
      trackAddToCart(Number.parseFloat(totalPrice), value)
    } else if (e.target.value === "") {
      setQuantity(minQuantity)
    } else if (value > maxQuantity) {
      const newQty = maxQuantity
      setQuantity(newQty)
      setSelectedQuantity(0)
      const totalPrice = (newQty * pricePerTicket).toFixed(2)
      trackAddToCart(Number.parseFloat(totalPrice), newQty)
    }
  }

  const totalPrice = (quantity * pricePerTicket).toFixed(2)

  const handleBuyClick = () => {
    setIsCheckoutOpen(true)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header com Logo */}
      <header className="bg-white p-3 sm:p-4 flex items-center justify-between border-b">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ODx1rLRAaDQT-aVUCbVbgZTqf4v0e275UDVm8V0hdRA.png"
          alt="Viva Sorte Logo"
          width={160}
          height={45}
          className="h-6 sm:h-10 w-auto"
        />
        <HeaderMenu />
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-6 max-w-3xl mx-auto w-full">
        {/* Video Banner */}
        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 shadow-lg">
          <video autoPlay loop muted playsInline className="w-full h-auto">
            <source
              src="https://res.cloudinary.com/ds4yak1e2/video/upload/v1762454997/2d31363039353736353735-1920x1080_ddfh41.mp4"
              type="video/mp4"
            />
          </video>
        </div>

        {/* Informações do Sorteio */}
        <div className="w-full bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-4 sm:mb-6 flex-wrap gap-2">
            <p className="text-base sm:text-lg text-gray-700 font-medium">Sorteio</p>
            <span className="bg-orange-400 text-white px-3 sm:px-4 py-1 rounded-md text-sm sm:text-base font-bold">
              em {daysUntilSunday} dia{daysUntilSunday !== 1 ? "s" : ""}
            </span>
            <p className="text-base sm:text-lg text-gray-700 font-medium">por apenas</p>
            <span className="bg-[#1e3a8a] text-white px-3 sm:px-4 py-1 rounded-md text-sm sm:text-base font-bold">
              R$ 0,99
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Button +20 */}
            <button
              onClick={() => handleQuantitySelect(20)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 20 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <span className="text-2xl sm:text-3xl font-bold">+20</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 20 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>

            {/* Button +40 */}
            <button
              onClick={() => handleQuantitySelect(40)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 40 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <Star className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl sm:text-3xl font-bold">+40</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 40 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>

            {/* Button +60 */}
            <button
              onClick={() => handleQuantitySelect(60)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 60 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <span className="text-2xl sm:text-3xl font-bold">+60</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 60 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>

            {/* Button +80 */}
            <button
              onClick={() => handleQuantitySelect(80)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 80 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <span className="text-2xl sm:text-3xl font-bold">+80</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 80 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>

            {/* Button +100 */}
            <button
              onClick={() => handleQuantitySelect(100)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 100 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <span className="text-2xl sm:text-3xl font-bold">+100</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 100 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>

            {/* Button +200 */}
            <button
              onClick={() => handleQuantitySelect(200)}
              className={`rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center transition-all relative ${
                selectedQuantity === 200 ? "bg-green-600 text-white" : "bg-[#1e3a8a] text-white hover:bg-[#2952b3]"
              }`}
            >
              <span className="text-2xl sm:text-3xl font-bold">+200</span>
              <span className="text-xs sm:text-sm mt-1">{selectedQuantity === 200 ? "SELECIONADO" : "SELECIONAR"}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              onClick={handleDecrease}
              disabled={quantity <= minQuantity}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-gray-300 text-gray-700 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <input
              type="number"
              value={quantity}
              onChange={handleInputChange}
              min={minQuantity}
              max={maxQuantity}
              className="flex-1 h-10 sm:h-12 text-center text-xl sm:text-2xl font-bold bg-white rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
            />

            <button
              onClick={handleIncrease}
              disabled={quantity >= maxQuantity}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center hover:bg-[#2952b3] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <Button
            size="lg"
            onClick={handleBuyClick}
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Comprar</span>
            <span className="font-bold">R$ {totalPrice}</span>
          </Button>
        </div>

        <p className="text-gray-600 text-center text-sm sm:text-base mb-6">
          Comprar mais títulos aumenta suas chances de ganhar!
        </p>

        <div className="w-full mb-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JRfIanxwgrlBtzr6Fu14tvvYiIm2Po.png"
            alt="Promoção 100.000X"
            width={720}
            height={160}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </main>

      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ODx1rLRAaDQT-aVUCbVbgZTqf4v0e275UDVm8V0hdRA.png"
              alt="Viva Sorte Logo"
              width={180}
              height={50}
              className="h-10 w-auto"
            />
          </div>

          {/* Social Media Icons */}
          <div className="flex gap-4 mb-6 justify-center">
            <a
              href="#"
              className="w-10 h-10 rounded-lg border-2 border-[#1e3a8a] flex items-center justify-center text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.059-1.281-.073-1.689-.073-4.948 0-3.259.014-3.668.072-4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.949.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-lg border-2 border-[#1e3a8a] flex items-center justify-center text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-lg border-2 border-[#1e3a8a] flex items-center justify-center text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-lg border-2 border-[#1e3a8a] flex items-center justify-center text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-700 leading-relaxed text-justify">
              VIVA SORTE DO DIA e HORA DO VIVA SORTE DO DIA/HORA DO VIVA, as quais o subscritor declara ter tomado
              ciência. A aprovação deste plano pela Susep não implica, por parte da Autarquia, em incentivo ou
              recomendação a sua aquisição, representando, exclusivamente, sua adequação às normas em vigor. É
            </p>
          </div>

          <hr className="border-gray-300 mb-6" />

          {/* Partner Logos */}
          <div className="space-y-6">
            {/* Títulos emitidos por */}
            <div>
              <p className="text-sm text-gray-700 font-medium mb-2">Títulos emitidos por:</p>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ZsSmLm0Dg3FD-TxFaZ6LhOnpugCTxvTmXNBbV5JcNnO.png"
                alt="ViaCap"
                width={100}
                height={40}
                className="h-8 w-auto"
              />
            </div>

            {/* Promoção realizada por */}
            <div>
              <p className="text-sm text-gray-700 font-medium mb-2">Promoção realizada por:</p>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/xmCs4XwZC2vZ-usW7BjO41RgAb9ZA8mF4YjkBFj00Zt.png"
                alt="VIVA Privilégios"
                width={120}
                height={50}
                className="h-10 w-auto"
              />
            </div>

            {/* Desenvolvimento */}
            <div>
              <p className="text-sm text-gray-700 font-medium mb-2">Desenvolvimento:</p>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Z2l8Skv6tqHZ-pBcZX6SucBFzLeXrGhuRVmKDpAIHZq.png"
                alt="EDJ.digital"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>
      </footer>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        quantity={quantity}
        totalPrice={Number.parseFloat(totalPrice)}
      />
    </div>
  )
}
