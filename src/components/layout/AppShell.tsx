import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';
import Footer from './Footer';
import LanguageTransition from '../common/LanguageTransition';

interface AppShellProps {
    children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const isPOS = location.pathname === '/pos';

    return (
        <div className="h-screen w-screen flex overflow-hidden bg-secondary text-secondary selection:bg-accent-light">
            <LanguageTransition />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-primary overflow-hidden animate-fadeIn relative">
                {!isPOS && <TitleBar />}
                <main className={`h-0 grow bg-primary scrollbar-hide flex flex-col ${isPOS ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {isPOS ? (
                        <div className="h-0 grow flex flex-col overflow-hidden">{children}</div>
                    ) : (
                        <>
                            <div className="w-full p-6 flex-1">{children}</div>
                            <Footer />
                        </>
                    )}
                </main>

                {!isPOS && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent pointer-events-none z-20" />
                )}
            </div>
        </div>
    );
}
