'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@/components/Navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/Sheet'
import { Button } from '@/components/Button'
import { Session } from 'next-auth'
import { UserNav } from '../UserNav'
import { cn } from '../../../lib/utils';

type NavListProps = {
    className?: string | undefined,
    orientation?: "horizontal" | "vertical" | undefined
}

type MainNavigationProps = {
    session: Session | null
}

const MainNavigation = ({ session }: MainNavigationProps) => {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    const adminNav = [
        { href: '/orar', label: 'Orar' },
        { href: '/cadre', label: 'Cadre didactice' },
        { href: '/discipline', label: 'Discipline' },
        { href: '/grupe', label: 'Grupe' },
        { href: '/sali', label: 'Sali clasa' },
        { href: '/utilizatori', label: 'Utilizatori' }
    ]

    const secretarNav = [
        { href: '/orar', label: 'Orar' },
        { href: '/cadre', label: 'Cadre didactice' },
        { href: '/discipline', label: 'Discipline' },
        { href: '/grupe', label: 'Grupe' },
        { href: '/sali', label: 'Sali clasa' }
    ]

    const profesorNav = [
        { href: '/orar', label: 'Orar' }
    ]

    const studentNav = [
        { href: '/orar', label: 'Orar' }
    ]

    const authNav =
        session?.user.role === 'ADMIN' ? adminNav :
        session?.user.role === 'SECRETAR' ? secretarNav :
        session?.user.role === 'PROFESOR' ? profesorNav :
        session?.user.role === 'STUDENT' ? studentNav :
        secretarNav

    const publicNav = [
        { href: '/login', label: 'Login' },
    ]

    const nav = session ? authNav : publicNav;

    const NavList = ({ className, orientation }: NavListProps) => (
        <NavigationMenu className={cn(className, "flex flex-col w-full gap-4 md:flex-row")} orientation={orientation}>
            <NavigationMenuList >
                {nav.map((item) => (
                    <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink
                            data-active={pathname.includes(item.href)}
                            asChild
                        >
                            <Link href={item.href}>
                                {item.label}
                            </Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
            {session && <UserNav user={session?.user} />}
        </NavigationMenu>
    )

    return (
        <>
            <div className="md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon-m">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right">
                        <SheetHeader>
                            <SheetTitle>Navigation</SheetTitle>
                        </SheetHeader>

                        <div className="p-2 h-full">
                            <NavList orientation='vertical' className='w-full' />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="hidden md:flex gap-2">
                <NavList />
            </div>
        </ >
    )
}

export { MainNavigation };