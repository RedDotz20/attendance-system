import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function Dashboard() {
	const { user, signOut } = useAuth();
	const handleSignOut = () => signOut.mutate();

	return (
		<div className="container w-full flex flex-col justify center items-center bg-amber-100">
			<h1>Hello Dashboard!</h1>
			<p className="mb-4">Welcome to your protected dashboard.</p>
			{user && (
				<div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
					<h2 className="font-semibold mb-2">User Info:</h2>
					<pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
				</div>
			)}
			<Button
				onClick={handleSignOut}
				variant="destructive"
			>
				Logout
			</Button>
		</div>
	);
}
