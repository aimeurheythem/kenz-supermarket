import './styles/globals.css';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { initDatabase } from '../database/db';
import { seedDatabase } from '../database/seed';
import './i18n';

function Root() {
    const [dbReady, setDbReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Initialize DB as fast as possible without artificial delay
                await initDatabase();
                seedDatabase();
                setDbReady(true);
            } catch (err: any) {
                console.error('Database init failed:', err);
                setError(err.message);
            }
        };

        init();
    }, []);

    if (error) {
        return <div className="p-4 text-red-500">Database Error: {error}</div>;
    }

    if (!dbReady) {
        return null; // Don't show any loading screen, just wait
    }

    return (
        <HashRouter>
            <App />
        </HashRouter>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>
);
