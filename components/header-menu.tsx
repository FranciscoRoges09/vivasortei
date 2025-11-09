"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut, LogIn, LayoutDashboard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  email: string
  name?: string
}

export default function HeaderMenu() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in by checking sessionStorage
    const storedUser = sessionStorage.getItem("logged_in_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Error parsing stored user:", e)
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem("logged_in_user")
    setUser(null)
    router.push("/")
  }

  const handleLoginClick = () => {
    router.push("/dashboard/login")
  }

  const handleDashboardClick = () => {
    router.push("/dashboard")
  }

  if (isLoading) {
    return <button className="text-[#1e3a8a] text-xl sm:text-2xl cursor-default">☰</button>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-[#1e3a8a] text-xl sm:text-2xl hover:opacity-70 transition-opacity">☰</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user ? (
          <>
            <div className="px-3 py-2 text-sm">
              <p className="font-semibold text-gray-900">{user.email}</p>
              {user.name && <p className="text-gray-500 text-xs">{user.name}</p>}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span>Meu Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sair</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleLoginClick} className="cursor-pointer">
            <LogIn className="w-4 h-4 mr-2" />
            <span>Fazer Login</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
