'use client';
import { createContext, useContext, useState, useCallback } from 'react';
import GlobalConfirmation from '@/components/UI/GlobalConfirmation';
import { AnimatePresence } from 'framer-motion';

const ConfirmationContext = createContext();

export function ConfirmationProvider({ children }) {
 const [config, setConfig] = useState({
 isOpen: false,
 title: '',
 message: '',
 confirmText: 'Confirm',
 cancelText: 'Cancel',
 type: 'danger', // danger, warning, info
 onConfirm: () => {},
 onCancel: () => {},
 });

 const confirm = useCallback(({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) => {
 return new Promise((resolve) => {
 setConfig({
 isOpen: true,
 title: title || 'Are you sure?',
 message: message || 'This action cannot be undone.',
 confirmText: confirmText || 'Confirm',
 cancelText: cancelText || 'Cancel',
 type: type || 'danger',
 onConfirm: () => {
 setConfig(prev => ({ ...prev, isOpen: false }));
 if (onConfirm) onConfirm();
 resolve(true);
 },
 onCancel: () => {
 setConfig(prev => ({ ...prev, isOpen: false }));
 if (onCancel) onCancel();
 resolve(false);
 },
 });
 });
 }, []);

 return (
 <ConfirmationContext.Provider value={confirm}>
 {children}
 <AnimatePresence>
 {config.isOpen && (
 <GlobalConfirmation 
 {...config} 
 onClose={() => setConfig(prev => ({ ...prev, isOpen: false }))} 
 />
 )}
 </AnimatePresence>
 </ConfirmationContext.Provider>
 );
}

export const useConfirm = () => {
 const context = useContext(ConfirmationContext);
 if (!context) {
 throw new Error('useConfirm must be used within a ConfirmationProvider');
 }
 return context;
};


