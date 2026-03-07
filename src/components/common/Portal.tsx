import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
    const portalRoot = document.getElementById('portal-root') || document.body;
    return createPortal(children, portalRoot);
}
