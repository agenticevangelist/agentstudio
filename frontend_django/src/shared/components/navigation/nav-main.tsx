"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/shared/ui/sidebar";

type NavItem = {
	title: string;
	url: string;
	icon?: React.ComponentType<any>;
	isActive?: boolean;
};

type NavGroup = {
	title: string;
	url?: string;
	items: NavItem[];
};

export function NavMain({ items }: { items: NavGroup[] }) {
	const pathname = usePathname();

	return (
		<>
			{items.map((group) => (
				<SidebarGroup key={group.title}>
					<SidebarGroupLabel>{group.title}</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{group.items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={item.isActive ?? (pathname === item.url || pathname?.startsWith(item.url))}
									>
										<Link href={item.url}>
											{item.icon ? <item.icon /> : null}
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			))}
		</>
	);
}


