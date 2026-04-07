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
  const [isAuthReady, setIsAuthReady] = useState(true); // Always ready in local mode

  const fetchData = async () => {
    try {
      const [regRes, condRes, muelleRes, empRes, configRes] = await Promise.all([
        fetch('/api/registros').then(res => res.json()),
        fetch('/api/conductores').then(res => res.json()),
        fetch('/api/muelles').then(res => res.json()),
        fetch('/api/empresas').then(res => res.json()),
        fetch('/api/config').then(res => res.json())
      ]);
      console.log('Fetched Empresas:', empRes);
      setRegistros(regRes);
      setConductores(condRes);
      setMuelles(muelleRes);
      setEmpresas(empRes);
      setLogo(configRes.logo);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => fetchData();

  const finCargue = async (registroId: string) => {
    try {
      await fetch('/api/fin-cargue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registroId }),
      });
      refreshData();
      toast.success('Cargue finalizado');
    } catch (error) {
      toast.error('Error al finalizar cargue');
    }
  };

  const borrarRegistro = async (registroId: string) => {
    try {
      await fetch(`/api/registros/${registroId}`, { method: 'DELETE' });
      refreshData();
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error('Error al eliminar registro');
    }
  };

  const updateLogo = async (newLogo: string) => {
    try {
      await fetch('/api/config/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: newLogo }),
      });
      setLogo(newLogo);
      toast.success('Logo actualizado');
    } catch (error) {
      toast.error('Error al actualizar logo');
    }
  };

  const addEmpresa = async (nombre: string) => {
    try {
      await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      refreshData();
      toast.success('Empresa añadida');
    } catch (error) {
      toast.error('Error al añadir empresa');
    }
  };

  const addMuelle = async (nombre: string) => {
    try {
      await fetch('/api/muelles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      refreshData();
      toast.success('Muelle añadido');
    } catch (error) {
      toast.error('Error al añadir muelle');
    }
  };

  const deleteMuelle = async (id: string) => {
    try {
      await fetch(`/api/muelles/${id}`, { method: 'DELETE' });
      refreshData();
      toast.success('Muelle eliminado');
    } catch (error) {
      toast.error('Error al eliminar muelle');
    }
  };

  const addRegistro = async (registro: any) => {
    try {
      await fetch('/api/registro-muelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro),
      });
      refreshData();
      toast.success('Registro exitoso');
    } catch (error) {
      toast.error('Error al crear registro');
    }
  };

  const addConductor = async (conductor: any) => {
    try {
      await fetch('/api/conductores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conductor),
      });
      refreshData();
      toast.success('Conductor registrado');
    } catch (error) {
      toast.error('Error al registrar conductor');
    }
  };

  return (
    <AppContext.Provider value={{ 
      registros, conductores, muelles, empresas, loading, setLoading, refreshData, 
      finCargue, borrarRegistro, logo, updateLogo, isAuthReady,
      addEmpresa, addMuelle, deleteMuelle, addRegistro, addConductor
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
