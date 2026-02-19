import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';
import Footer from './Footer';
import LanguageTransition from '../common/LanguageTransition';

interface AppShellProps {
    children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
    return (
        <div className="h-screen w-screen flex overflow-hidden bg-secondary text-secondary selection:bg-accent-light app-drag-region">
            <LanguageTransition />
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 bg-primary overflow-hidden animate-fadeIn relative">
                <TitleBar />
                <main className="flex-1 overflow-y-auto bg-primary scrollbar-hide app-no-drag flex flex-col">
                    <div className="w-full p-6 flex-1">{children}</div>
                    <Footer />
                </main>

                {/* Smooth Bottom Fade */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--color-bg-primary)] to-transparent pointer-events-none z-20" />
            </div>
        </div>
    );
}
