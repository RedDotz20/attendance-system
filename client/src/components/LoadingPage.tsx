import { Loader2 } from "lucide-react";

export default function LoadingPage() {
	return (
		<div className="bg-foreground min-h-screen flex items-center justify-center">
			<div className="text-center space-y-6 text-accent">
				{/* Animated spinner */}
				<div className="relative">
					<Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
					<div className="absolute inset-0 h-12 w-12 border-2 border-primary/20 rounded-full mx-auto animate-pulse" />
				</div>

				{/* Loading text */}
				<div className="space-y-2 text-accent">
					<h2 className="text-2xl font-semibold">Loading</h2>
					<p className="text-muted-foreground">
						Please wait while we prepare your content...
					</p>
				</div>

				{/* Progress bar */}
				<div className="w-64 mx-auto text-accent">
					<div className="h-2 rounded-full overflow-hidden">
						<div
							className="h-full bg-accent rounded-full animate-pulse"
							style={{
								animation: "loading-progress 2s ease-in-out infinite",
							}}
						/>
					</div>
				</div>

				{/* Animated dots */}
				<div className="flex justify-center space-x-1">
					<div
						className="w-2 h-2 bg-accent rounded-full animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<div
						className="w-2 h-2 bg-accent rounded-full animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<div
						className="w-2 h-2 bg-accent rounded-full animate-bounce"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
			</div>
		</div>
	);
}
