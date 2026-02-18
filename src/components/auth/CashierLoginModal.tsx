import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRepo } from '../../../database';
import type { User } from '@/lib/types';
import { Users, Lock, ArrowRight, Banknote } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface CashierLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CashierLoginModal({ isOpen, onClose, onSuccess }: CashierLoginModalProps) {
    const [selectedCashier, setSelectedCashier] = useState<User | null>(null);
    const [pinCode, setPinCode] = useState('');
    const [openingCash, setOpeningCash] = useState('');
    const [step, setStep] = useState<'select' | 'pin' | 'cash'>('select');
    const [error, setError] = useState('');
    const [cashiers, setCashiers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { loginCashier, startCashierSession } = useAuthStore();

    // Load cashiers when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCashiers();
        }
    }, [isOpen]);

    const loadCashiers = async () => {
        try {
            const activeCashiers = await UserRepo.getActiveCashiers();
            setCashiers(activeCashiers);
        } catch (err) {
            console.error('Failed to load cashiers:', err);
            setError('Failed to load cashiers');
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            console.log('Modal opened, resetting state');
            setSelectedCashier(null);
            setPinCode('');
            setOpeningCash('');
            setStep('select');
            setError('');
        }
    }, [isOpen]);

    const handleCashierSelect = (cashier: User) => {
        console.log('Cashier selected:', cashier.full_name, 'ID:', cashier.id);
        setSelectedCashier(cashier);
        setPinCode(''); // Reset PIN
        setStep('pin');
        setError('');
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCashier) return;

        console.log('Attempting PIN login for cashier:', selectedCashier.id);
        setIsLoading(true);
        const success = await loginCashier(selectedCashier.id, pinCode);
        console.log('PIN login result:', success);
        setIsLoading(false);

        if (success) {
            console.log('PIN accepted, moving to cash step');
            setStep('cash');
            setError('');
        } else {
            console.log('PIN rejected');
            setError('Invalid PIN code');
        }
    };

    const handleCashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCashier) return;

        const cash = parseFloat(openingCash);
        if (isNaN(cash) || cash < 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            console.log('=== STARTING SESSION ===');
            console.log('Cashier ID:', selectedCashier.id);
            console.log('Opening Cash:', cash);
            console.log('Cashier Name:', selectedCashier.full_name);

            setError('Creating session... Please wait.');
            setIsLoading(true);

            const session = await startCashierSession(selectedCashier.id, cash);

            console.log('=== SESSION RESULT ===');
            console.log('Session object:', session);
            console.log('Session ID:', session?.id);
            console.log('Session login_time:', session?.login_time);

            setIsLoading(false);

            if (session && session.id && session.login_time) {
                console.log('✓ Session created successfully!');
                // Reset form
                setSelectedCashier(null);
                setPinCode('');
                setOpeningCash('');
                setStep('select');
                setError('');
                // Close modal and navigate
                onSuccess();
            } else {
                console.error('✗ Session creation failed - invalid session object');
                setError('Failed to start session. Check console for details (F12).');
            }
        } catch (err) {
            setIsLoading(false);
            console.error('=== EXCEPTION ===');
            console.error('Error starting session:', err);
            setError('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleClose = () => {
        console.log('Closing modal and resetting state');
        // Reset form immediately
        setSelectedCashier(null);
        setPinCode('');
        setOpeningCash('');
        setStep('select');
        setError('');
        // Then close
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Cashier Login
                        </DialogTitle>
                        <DialogDescription className="text-white/70 text-sm">
                            {step === 'select' ? 'Select your name to start' : step === 'pin' ? 'Enter your PIN' : 'Enter opening cash'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'select' && (
                            <div>
                                <p className="text-gray-600 mb-4">Select your name to start your shift:</p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {cashiers.map((cashier) => (
                                        <button
                                            key={cashier.id}
                                            onClick={() => handleCashierSelect(cashier)}
                                            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                                {cashier.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{cashier.full_name}</p>
                                                <p className="text-sm text-gray-500">@{cashier.username}</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                                {cashiers.length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        No active cashiers found. Please contact the owner.
                                    </p>
                                )}
                            </div>
                        )}

                        {step === 'pin' && selectedCashier && (
                            <form onSubmit={handlePinSubmit}>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                                        {selectedCashier.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedCashier.full_name}</h3>
                                    <p className="text-sm text-gray-500">Enter your PIN code</p>
                                </div>

                                <div className="mb-4">
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest text-gray-900"
                                            placeholder="••••"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('select')}
                                        className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={pinCode.length < 4 || isLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Verifying...' : 'Continue'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'cash' && selectedCashier && (
                            <form onSubmit={handleCashSubmit}>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white mx-auto mb-3">
                                        <Banknote size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800">Opening Cash</h3>
                                    <p className="text-sm text-gray-500">Enter the cash amount in your drawer</p>
                                </div>

                                <div className="mb-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={openingCash}
                                            onChange={(e) => setOpeningCash(e.target.value)}
                                            className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none text-center text-2xl text-gray-900"
                                            placeholder="0,00"
                                            autoFocus
                                        />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">DZ</span>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('pin')}
                                        className="flex-1 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!openingCash || isLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg font-semibold hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Starting...' : 'Start Shift'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
    );
}
