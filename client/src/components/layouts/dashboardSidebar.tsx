import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
// import { NavGroup } from "@/components/layout/nav-group";
// import { NavUser } from "@/components/layout/nav-user";
// import { TeamSwitcher } from "@/components/layout/team-switcher";
// import { sidebarData } from "./data/sidebar-data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			collapsible="icon"
			variant="floating"
			{...props}
		>
			<SidebarHeader>
				sidebar header
				{/* <TeamSwitcher teams={sidebarData.teams} /> */}
			</SidebarHeader>
			<SidebarContent>
				sidebar content
				{/* {sidebarData.navGroups.map((props) => (
					<NavGroup
						key={props.title}
						{...props}
					/>
				))} */}
			</SidebarContent>
			<SidebarFooter>
				sidebar footer
				{/* <NavUser user={sidebarData.user} /> */}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
