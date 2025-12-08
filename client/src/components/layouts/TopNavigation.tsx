import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Settings, LogOut, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function TopNavigation() {
	const { user, signOut } = useAuth();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between mx-auto">
				{/* Logo/Brand */}
				<div className="flex items-center space-x-2">
					{/* <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
						<span className="text-primary-foreground font-bold text-sm">A</span>
					</div> */}
					<span className="font-semibold text-lg">Attendance System</span>
				</div>

				{/* Navigation Links */}
				<nav className="hidden md:flex items-center space-x-6">
					<Link
						to="/dashboard"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Dashboard
					</Link>
					<Link
						to="/dashboard/realtime"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Real-time
					</Link>
					<Link
						to="/dashboard/analytics"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Analytics
					</Link>
					<Link
						to="/dashboard/device-control"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Device Control
					</Link>
					<a
						href="/fingerprints"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Fingerprints
					</a>
					<Link
						to="/users"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Users
					</Link>
				</nav>

				{/* Right Side Actions */}
				<div className="flex items-center space-x-3">
					{/* Todo: Search Button */}
					{/* <Button
						variant="ghost"
						size="icon"
						className="hidden sm:flex"
					>
						<Search className="h-4 w-4" />
						<span className="sr-only">Search</span>
					</Button> */}

					{/* Todo: Notifications */}
					{/* <Button
						variant="ghost"
						size="icon"
						className="relative"
					>
						<Bell className="h-4 w-4" />
						<span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
						<span className="sr-only">Notifications</span>
					</Button> */}

					{/* Avatar Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-10 w-10 rounded-full"
							>
								<Avatar className="h-10 w-10">
									<AvatarImage
										src="/professional-headshot.png"
										alt="User avatar"
									/>
									<AvatarFallback>JD</AvatarFallback>
								</Avatar>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-56"
							align="end"
							forceMount
						>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{user?.name}
									</p>
									<p className="text-xs leading-none text-muted-foreground">
										{user?.email}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => {}}>
								<User className="mr-2 h-4 w-4" />
								<span>Profile</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => {}}>
								<Settings className="mr-2 h-4 w-4" />
								<span>Settings</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={signOut}>
								<LogOut className="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
