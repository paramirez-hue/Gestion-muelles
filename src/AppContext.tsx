import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from './lib/supabase';

const AppContext = createContext<any>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [muelles, setMuelles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(true);

  const fetchData = async () => {
    if (!supabase) {
      console.warn('Supabase client not initialized. Please check your credentials.');
      return;
    }
    try {
      const [regRes, condRes, muelleRes, empRes, configRes] = await Promise.all([
        supabase.from('registros').select('*').order('created_at', { ascending: false }),
        supabase.from('conductores').select('*'),
        supabase.from('muelles').select('*').order('nombre'),
        supabase.from('empresas').select('*').order('nombre'),
        supabase.from('config').select('*').eq('key', 'logo').single()
      ]);

      if (regRes.data) setRegistros(regRes.data);
      if (condRes.data) setConductores(condRes.data);
      if (muelleRes.data) setMuelles(muelleRes.data);
      if (empRes.data) setEmpresas(empRes.data);
      if (configRes.data) setLogo(configRes.data.value);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();

    if (!supabase) return;

    // Real-time subscriptions
    const channels = [
      supabase.channel('registros').on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, fetchData).subscribe(),
      supabase.channel('conductores').on('postgres_changes', { event: '*', schema: 'public', table: 'conductores' }, fetchData).subscribe(),
      supabase.channel('muelles').on('postgres_changes', { event: '*', schema: 'public', table: 'muelles' }, fetchData).subscribe(),
      supabase.channel('empresas').on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, fetchData).subscribe(),
      supabase.channel('config').on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, fetchData).subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const refreshData = () => fetchData();

  const finCargue = async (registroId: string) => {
    try {
      const { error } = await supabase
        .from('registros')
        .update({ status: 'FINALIZADO', fin_cargue: new Date().toISOString() })
        .eq('id', registroId);
      
      if (error) throw error;
      toast.success('Cargue finalizado');
    } catch (error) {
      toast.error('Error al finalizar cargue');
    }
  };

  const borrarRegistro = async (registroId: string) => {
    try {
      const { error } = await supabase.from('registros').delete().eq('id', registroId);
      if (error) throw error;
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error('Error al eliminar registro');
    }
  };

  const updateLogo = async (newLogo: string) => {
    try {
      const { error } = await supabase
        .from('config')
        .upsert({ key: 'logo', value: newLogo }, { onConflict: 'key' });
      
      if (error) throw error;
      setLogo(newLogo);
      toast.success('Logo actualizado');
    } catch (error) {
      toast.error('Error al actualizar logo');
    }
  };

  const addEmpresa = async (nombre: string) => {
    try {
      const { error } = await supabase.from('empresas').insert([{ nombre }]);
      if (error) throw error;
      toast.success('Empresa añadida');
    } catch (error) {
      toast.error('Error al añadir empresa');
    }
  };

  const addMuelle = async (nombre: string) => {
    try {
      const { error } = await supabase.from('muelles').insert([{ nombre }]);
      if (error) throw error;
      toast.success('Muelle añadido');
    } catch (error) {
      toast.error('Error al añadir muelle');
    }
  };

  const deleteMuelle = async (id: string) => {
    try {
      const { error } = await supabase.from('muelles').delete().eq('id', id);
      if (error) throw error;
      toast.success('Muelle eliminado');
    } catch (error) {
      toast.error('Error al eliminar muelle');
    }
  };

  const addRegistro = async (registro: any) => {
    try {
      const { error } = await supabase.from('registros').insert([{
        ...registro,
        status: 'ESPERA',
        fecha: new Date().toISOString()
      }]);
      if (error) throw error;
      toast.success('Registro exitoso');
    } catch (error) {
      toast.error('Error al crear registro');
    }
  };

  const addConductor = async (conductor: any) => {
    try {
      const { error } = await supabase.from('conductores').insert([conductor]);
      if (error) throw error;
      toast.success('Conductor registrado');
    } catch (error) {
      toast.error('Error al registrar conductor');
    }
  };

  const registrarSalida = async (conductorId: string) => {
    try {
      const { error } = await supabase
        .from('registros')
        .update({ 
          salida: new Date().toISOString(), 
          status: 'SALIDA' 
        })
        .eq('conductorId', conductorId)
        .is('salida', null);
      
      if (error) throw error;
      toast.success('Salida registrada');
    } catch (error) {
      toast.error('Error al registrar salida');
      throw error;
    }
  };

  const asignarMuelle = async (registroId: string, muelle: string) => {
    try {
      const { error } = await supabase
        .from('registros')
        .update({ 
          muelle, 
          status: 'CARGANDO', 
          inicio_cargue: new Date().toISOString() 
        })
        .eq('id', registroId);
      
      if (error) throw error;
      toast.success('Muelle asignado');
    } catch (error) {
      toast.error('Error al asignar muelle');
    }
  };

  return (
    <AppContext.Provider value={{ 
      registros, conductores, muelles, empresas, loading, setLoading, refreshData, 
      finCargue, borrarRegistro, logo, updateLogo, isAuthReady,
      addEmpresa, addMuelle, deleteMuelle, addRegistro, addConductor, asignarMuelle, registrarSalida
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
