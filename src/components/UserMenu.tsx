'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User as UserIcon, LogOut, Shield, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLocale } from '@/context/LocaleContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { user, logOut } = useAuth()
  const { t } = useLocale()
  const router = useRouter()

  const handleLogout = async () => {
    await logOut()
    router.replace('/')
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" asChild className="gap-1.5">
        <Link href="/auth"><LogIn className="w-4 h-4" />{t('nav.login')}</Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <UserIcon className="w-4 h-4" />
          </span>
          <span className="hidden sm:inline max-w-[8rem] truncate">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === 'admin' && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="gap-2"><Shield className="w-4 h-4" />{t('nav.admin')}</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4" />{t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
