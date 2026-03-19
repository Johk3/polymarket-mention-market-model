import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';

export default function Welcome({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                <header className="w-full p-6 lg:p-8">
                    <nav className="flex items-center justify-end gap-4 text-sm font-medium">
                        {auth.user ? (
                            <Link href={dashboard()} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={login()} className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link href={register()} className="rounded-md bg-slate-900 shadow-sm px-4 py-2 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                        Polymarket Mention
                        <br className="sm:hidden" /> Market Model
                    </h1>
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
                        An analytics platform tracking mention markets using real-time and historical data.
                    </p>
                    <div className="flex gap-4">
                        {auth.user ? (
                            <Link href={dashboard()} className="rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link href={login()} className="rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100">
                                Get Started
                            </Link>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
