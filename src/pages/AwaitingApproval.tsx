import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AwaitingApproval: React.FC = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} className="text-amber-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Pendente</h1>
                <p className="text-gray-500 mb-6">
                    Olá, <span className="font-semibold text-gray-900">{user?.name}</span>.
                    Seu cadastro foi realizado com sucesso, mas você ainda não possui permissão para acessar o sistema.
                </p>

                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-8 text-left">
                    <p className="font-bold mb-1">O que fazer?</p>
                    <p>Solicite a um Administrador ou CEO para liberar seu acesso atribuindo um cargo ao seu perfil.</p>
                </div>

                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                    <LogOut size={18} />
                    Sair e tentar novamente
                </button>
            </div>
        </div>
    );
};
