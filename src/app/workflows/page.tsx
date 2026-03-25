import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { DEV_PHONES } from '@/config/devs';
import WorkflowExplorer from '@/app/workflows/WorkflowExplorer';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/models';
import { Suspense } from 'react';

export const metadata = {
	title: 'System Workflows',
};

export default async function WorkflowsPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value;

	if (!token) {
		redirect('/mui/login');
	}

	const decoded = await verifyToken(token);

	if (!decoded || !decoded.id) {
		redirect('/mui/login');
	}

	// Fetch user to get phone number (since it's not in the JWT)
	const user: any = await User.findByPk(decoded.id);

	if (!user || (!user.phone && !user.email)) {
		redirect('/mui/login');
	}

	const fullPhone = `${user.country_code || '+971'}${user.phone}`;

	// Protected Developer Route Logic
	if (!DEV_PHONES.includes(fullPhone) && !DEV_PHONES.includes(user.phone)) {
		redirect('/mui/admin/dashboard');
	}

	return (
		<div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
			{/* Top Navigation Bar */}
			<header className="flex-shrink-0 flex items-center h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
				<Link
					href="/mui/admin/dashboard"
					className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
				>
					<ArrowLeft className="w-5 h-5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" />
				</Link>
				<h1 className="text-lg font-semibold tracking-tight">System Workflows Explorer</h1>
				<div className="ml-auto text-sm text-gray-500 dark:text-gray-400 font-mono hidden sm:inline-block">
					Authorized Dev: {fullPhone}
				</div>
			</header>

			{/* Main Horizontal Explorer Area */}
			<main className="flex-1 overflow-x-auto overflow-y-hidden shadow-inner flex">
				<Suspense fallback={<div className="p-4 text-gray-500">Loading workflows...</div>}>
					<WorkflowExplorer />
				</Suspense>
			</main>
		</div>
	);
}
