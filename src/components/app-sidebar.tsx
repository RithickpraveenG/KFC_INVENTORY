"use client"

import * as React from "react"
import {
    Activity,
    BookOpen,
    Bot,
    ChartPie,
    Frame,
    GalleryVerticalEnd,
    LayoutDashboard,
    Layers,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Database,
    Clock,
    LogOut,
    UserCircle,
    Users
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    // Define navigation items dynamically or filter them
    const navMain = [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            roles: ['ADMIN', 'OPERATOR'], // Visible to both
        },
        {
            title: "Production Entry",
            url: "/entry",
            icon: Layers,
            roles: ['ADMIN', 'OPERATOR'],
        },
        {
            title: "Master Data",
            url: "/settings",
            icon: Database,
            roles: ['ADMIN'], // Only Admin
            items: [
                {
                    title: "Raw Materials",
                    url: "/settings?tab=materials",
                },
                {
                    title: "Products",
                    url: "/settings?tab=products",
                },
                {
                    title: "Operators",
                    url: "/settings?tab=operators",
                },
                {
                    title: "Users",
                    url: "/admin/users",
                }
            ]
        },
    ];


    if (!user) return null; // Or render a simplified sidebar, or nothing on login page

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-3 px-3 py-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    {/* Logo Container */}
                    <div className="flex aspect-square size-12 items-center justify-center rounded-lg overflow-hidden">
                        <img
                            src="/logo.jpg"
                            alt="KCF"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    {/* Text - Hidden on Collapse */}
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-extrabold text-sidebar-foreground text-lg tracking-wide">KOVAI INVENTORY</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        {navMain.filter(item => item.roles.includes(user.role)).map((item) => (
                            <SidebarMenuItem key={item.title}>
                                {item.items ? (
                                    <SidebarMenuSub>  {/* Simplified for now, usually Collapsible */}
                                        <SidebarMenuButton tooltip={item.title} asChild isActive={pathname.startsWith(item.url)}>
                                            <Link href={item.url}>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {/* Manually rendering sub-items for this MVP if distinct */}
                                        <SidebarMenuSub>
                                            {item.items.map(sub => (
                                                <SidebarMenuSubItem key={sub.title}>
                                                    <SidebarMenuSubButton asChild isActive={pathname === sub.url || (sub.url.includes("?tab=") && pathname + window.location.search === sub.url)}>
                                                        <Link href={sub.url}>
                                                            <span>{sub.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </SidebarMenuSub>
                                ) : (
                                    <SidebarMenuButton tooltip={item.title} asChild isActive={pathname === item.url}>
                                        <Link href={item.url}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2 px-2 py-2">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                                <UserCircle className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.username}</span>
                                <span className="truncate text-xs">{user.role}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => logout()}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
