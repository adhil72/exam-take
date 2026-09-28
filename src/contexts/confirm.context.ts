import { createContext, useContext } from "react";

type ConfirmOptions = {
    type?: 'default' | 'success' | 'error'
    confirmText?: string
    cancelText?: string
    action?: () => Promise<any>
}

interface ConfirmContextType {
    confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean>;
}

const initialState: ConfirmContextType = {
    confirm: async (message: string) => {
        return window.confirm(message);
    }
};

export const ConfirmContext = createContext<ConfirmContextType>(initialState);
export const useConfirm = () => useContext(ConfirmContext);
