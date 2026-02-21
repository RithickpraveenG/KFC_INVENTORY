"use client"

import * as React from "react"
import {
    LayoutDashboard,
    Package, // Inventory
    ClipboardList, // Production Log
    Settings,
    UserCircle,
    LogOut,
    ChevronRight,
    Search
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

import { ProjectTitle } from "@/components/project-title"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, logout } = useAuth();

    const searchString = searchParams.toString();
    const fullCurrentPath = searchString ? `${pathname}?${searchString}` : pathname;

    // Define navigation items dynamically or filter them
    const navMain = [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
            roles: ['ADMIN', 'OPERATOR'],
        },
        {
            title: "Inventory",
            url: "/inventory",
            icon: Package,
            roles: ['ADMIN', 'OPERATOR'],
        },
        {
            title: "Production Log",
            url: "/entry",
            icon: ClipboardList,
            roles: ['ADMIN', 'OPERATOR'],
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            roles: ['ADMIN'],
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

    if (!user) return null;

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
            <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center">
                    <img src="/logo.jpg" alt="KCF Logo" className="size-8 object-contain rounded-sm" />
                    <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                        <ProjectTitle />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Manufacturing System</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarGroup>
                    <SidebarMenu className="space-y-1">
                        {navMain.filter(item => item.roles.includes(user.role)).map((item) => {
                            const isActive = pathname === item.url || (item.url !== '/' && pathname.startsWith(item.url));

                            return (
                                <SidebarMenuItem key={item.title}>
                                    {item.items ? (
                                        <SidebarMenuSub>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={isActive}
                                                className={`font-medium ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                            <SidebarMenuSub>
                                                {item.items.map(sub => (
                                                    <SidebarMenuSubItem key={sub.title}>
                                                        <SidebarMenuSubButton asChild isActive={pathname === sub.url || (sub.url.includes("?tab=") && fullCurrentPath === sub.url)}>
                                                            <Link href={sub.url}>
                                                                <span>{sub.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </SidebarMenuSub>
                                    ) : (
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            asChild
                                            isActive={isActive}
                                            className={`font-medium transition-all duration-200 ${isActive ? 'bg-blue-700 text-white hover:bg-blue-800 hover:text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                        >
                                            <Link href={item.url}>
                                                <item.icon className={isActive ? "text-white" : "text-slate-500"} />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <div className="flex items-center justify-center rounded-full bg-blue-50 p-2 text-blue-600">
                        <UserCircle className="size-5" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-slate-700">{user.name}</span>
                        <span className="truncate text-xs text-slate-500 capitalize">{user.role}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                        <LogOut className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
