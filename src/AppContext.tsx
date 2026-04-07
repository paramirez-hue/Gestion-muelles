import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const AppContext = createContext<any>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [muelles, setMuelles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setLogo(data.logo));
  }, []);

  const fetchData = async () => {
    const [regRes, condRes, muelleRes, empRes] = await Promise.all([
      fetch('/api/registros').then(res => res.json()),
      fetch('/api/conductores').then(res => res.json()),
      fetch('/api/muelles').then(res => res.json()),
      fetch('/api/empresas').then(res => res.json())
    ]);
    setRegistros(regRes);
    setConductores(condRes);
    setMuelles(muelleRes);
    setEmpresas(empRes);
  };

  const refreshData = () => fetchData();

  const finCargue = async (registroId: any) => {
    await fetch('/api/fin-cargue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registroId }),
    });
    refreshData();
    toast.success('Cargue finalizado');
  };

  const borrarRegistro = async (registroId: number) => {
    await fetch(`/api/registros/${registroId}`, { method: 'DELETE' });
    refreshData();
    toast.success('Registro eliminado');
  };

  const updateLogo = async (newLogo: string) => {
    await fetch('/api/config/logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: newLogo }),
    });
    setLogo(newLogo);
    toast.success('Logo actualizado');
  };

  return (
    <AppContext.Provider value={{ 
      registros, conductores, muelles, empresas, loading, setLoading, refreshData, 
      finCargue, borrarRegistro, logo, updateLogo 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
