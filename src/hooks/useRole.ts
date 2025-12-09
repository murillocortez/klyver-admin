import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export const useRole = () => {
    const { user } = useAuth();
    const role = user?.role || Role.NO_ACCESS;

    const canView = (page: string): boolean => {
        if (role === Role.CEO || role === Role.ADMIN) return true;
        if (role === Role.NENHUM || role === Role.NO_ACCESS) return false;

        switch (page) {
            case 'dashboard':
                return role === Role.GERENTE;
            case 'products':
                return true; // Gerente and Operador can view products
            case 'orders':
                return true; // Gerente and Operador
            case 'customers':
                return role === Role.GERENTE; // Only Gerente+
            case 'reports':
                return false; // Only Admin/CEO
            case 'settings':
                return role === Role.GERENTE; // View only
            case 'daily-offers':
                return role === Role.GERENTE;
            case 'team':
                return false;
            default:
                return false;
        }
    };

    const canEdit = (module: string): boolean => {
        if (role === Role.CEO || role === Role.ADMIN) return true;
        if (role === Role.NENHUM || role === Role.NO_ACCESS) return false;

        switch (module) {
            case 'products':
                return role === Role.GERENTE; // Operador cannot edit products
            case 'orders':
                return true; // Update status
            case 'settings':
                return false;
            case 'daily-offers':
                return role === Role.GERENTE;
            default:
                return false;
        }
    };

    const canDelete = (module: string): boolean => {
        if (role === Role.CEO || role === Role.ADMIN) return true;
        return false; // Gerente and Operador cannot delete
    };

    const canManageUsers = role === Role.CEO || role === Role.ADMIN;

    return { role, canView, canEdit, canDelete, canManageUsers };
};
