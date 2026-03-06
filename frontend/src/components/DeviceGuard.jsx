import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Monitor, Tablet, Smartphone, Lock } from 'lucide-react';

export default function DeviceGuard({ children }) {
    const { hasRole } = useAuth();
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
    const isAdmin = hasRole('admin') || hasRole('super_admin');

    useEffect(() => {
        const checkDevice = () => {
            // Screen width < 1024px is generally considered mobile or tablet
            setIsMobileOrTablet(window.innerWidth < 1024);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (isMobileOrTablet && !isAdmin) {
        return (
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                color: 'white',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '48px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    maxWidth: '480px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        marginBottom: '32px',
                        color: '#94a3b8'
                    }}>
                        <Smartphone size={32} />
                        <Tablet size={32} />
                        <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                        <Monitor size={32} style={{ color: '#818cf8' }} />
                    </div>

                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px', color: '#f8fafc' }}>
                        Desktop Access Required
                    </h1>

                    <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
                        Hi there! For security and a better workspace experience, the Employee Portal is only accessible via <strong>Laptop or Desktop</strong>.
                    </p>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(129, 140, 248, 0.1)',
                        color: '#818cf8',
                        padding: '8px 16px',
                        borderRadius: '99px',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        <Lock size={14} /> Admin access required for mobile
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
