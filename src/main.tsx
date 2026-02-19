/* eslint-disable react-refresh/only-export-components */
import './styles/globals.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { initDatabase } from '../database/db';
import { seedDatabase } from '../database/seed';
import './i18n';
import ErrorBoundary from './components/common/ErrorBoundary';

function Root() {
    const [dbReady, setDbReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Initialize DB as fast as possible without artificial delay
                await initDatabase();

                // Seed is non-fatal: if data already exists, silently skip
                try {
                    await seedDatabase();
                } catch (seedErr: any) {
                    console.warn('[Seed] Non-fatal seed error (data likely already exists):', seedErr.message);
                }

                setDbReady(true);
            } catch (err: any) {
                console.error('Database init failed:', err);
                setError(err.message);
            }
        };

        init();
    }, []);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading App</h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Reload App
                    </button>
                </div>
            </div>
        );
    }

    if (!dbReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading application...</p>
                </div>
            </div>
        );
    }

    return (
        <HashRouter>
            <App />
        </HashRouter>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <Root />
        </ErrorBoundary>
    </React.StrictMode>,
);
