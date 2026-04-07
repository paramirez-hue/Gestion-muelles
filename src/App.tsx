import React, { useState, useEffect } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Monitor from './Monitor';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KioskApp />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/admin" element={<AdminApp />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

function MonitorPage() {
  const { registros, conductores, muelles, refreshData, finCargue, borrarRegistro, logo } = useApp();
  const [showMuelleModal, setShowMuelleModal] = useState(false);
  const [registroAAsignar, setRegistroAAsignar] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const asignarMuelle = (registroId: any) => {
    setRegistroAAsignar(registroId);
    setShowMuelleModal(true);
  };

  const confirmarAsignacion = async (muelle: string) => {
    const response = await fetch('/api/asignar-muelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registroId: registroAAsignar, muelle }),
    });
    const data = await response.json();
    if (!data.success) {
      toast.error(data.message || 'Error al asignar muelle');
    } else {
      refreshData();
    }
    setShowMuelleModal(false);
    setRegistroAAsignar(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-red-600 p-4 shadow-lg flex items-center gap-6">
        {logo && <img src={logo} alt="Logo" className="h-12 bg-white p-1 rounded-full" />}
        <h1 className="text-white text-2xl font-bold uppercase tracking-wide">Monitor de Muelles en Tiempo Real</h1>
      </header>
      <div className="flex-grow">
        <Monitor 
          registros={registros} 
          conductores={conductores} 
          muelles={muelles} 
          finCargue={finCargue}
          borrarRegistro={borrarRegistro}
          asignarMuelle={asignarMuelle}
          showMuelleModal={showMuelleModal}
          setShowMuelleModal={setShowMuelleModal}
          confirmarAsignacion={confirmarAsignacion}
          hideHeader={true}
        />
      </div>
    </div>
  );
}

function AdminApp() {
  const { registros, conductores, muelles, empresas, refreshData, logo, updateLogo } = useApp();
  const [view, setView] = useState<'menu' | 'dashboard' | 'reportes' | 'config'>('menu');
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Acceso Administrativo</h2>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border rounded-xl mb-4 text-center text-2xl"
            placeholder="Clave"
          />
          <button 
            onClick={() => password === '1234' ? setIsAuthorized(true) : toast.error('Clave incorrecta')}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-xl"
          >
            Entrar
          </button>
          <Link to="/" className="block text-center mt-4 text-gray-500 underline">Volver al Kiosko</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Panel de Administración</h1>
        <button onClick={() => setIsAuthorized(false)} className="text-sm underline">Cerrar Sesión</button>
      </header>
      <main className="p-8">
        {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => setView('dashboard')} className="bg-green-600 text-white p-8 rounded-2xl font-bold text-2xl shadow-lg">Dashboard</button>
            <button onClick={() => setView('reportes')} className="bg-purple-600 text-white p-8 rounded-2xl font-bold text-2xl shadow-lg">Reportes</button>
            <button onClick={() => setView('config')} className="bg-gray-600 text-white p-8 rounded-2xl font-bold text-2xl shadow-lg">Configuración</button>
            <Link to="/monitor" className="bg-blue-600 text-white p-8 rounded-2xl font-bold text-2xl shadow-lg text-center">Ver Monitor</Link>
          </div>
        )}
        {view !== 'menu' && (
          <button onClick={() => setView('menu')} className="mb-6 flex items-center gap-2 text-gray-600">
            <ArrowLeft size={20} /> Volver al Menú
          </button>
        )}
        {/* Aquí irían los componentes de Dashboard, Reportes y Config que antes estaban en MainApp */}
        {view === 'dashboard' && <div className="text-center p-20">Contenido del Dashboard (Estadísticas)</div>}
        {view === 'reportes' && <div className="text-center p-20">Contenido de Reportes (CSV)</div>}
        {view === 'config' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Configuración de la Aplicación</h2>
            
            <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-4">Logo Corporativo</label>
              <div className="flex items-center gap-6">
                {logo && <img src={logo} alt="Logo actual" className="h-20 w-20 object-contain bg-white p-2 rounded-lg border shadow-sm" />}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Empresas</h3>
                <div className="flex gap-2 mb-4">
                  <input id="nuevaEmpresaAdmin" className="flex-grow p-2 border rounded uppercase text-sm" placeholder="Nueva empresa" />
                  <button onClick={() => { 
                    const input = document.getElementById('nuevaEmpresaAdmin') as HTMLInputElement;
                    if(input.value) {
                      fetch('/api/empresas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: input.value.toUpperCase() }),
                      }).then(() => { input.value = ''; refreshData(); });
                    }
                  }} className="bg-red-600 text-white px-4 py-2 rounded text-sm">Añadir</button>
                </div>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {empresas.map(e => <li key={e.id} className="p-2 bg-gray-100 rounded text-sm flex justify-between items-center">{e.nombre}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Muelles</h3>
                <div className="flex gap-2 mb-4">
                  <input id="nuevoMuelleAdmin" className="flex-grow p-2 border rounded uppercase text-sm" placeholder="Nuevo muelle" />
                  <button onClick={() => { 
                    const input = document.getElementById('nuevoMuelleAdmin') as HTMLInputElement;
                    if(input.value) {
                      fetch('/api/muelles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: input.value.toUpperCase() }),
                      }).then(() => { input.value = ''; refreshData(); });
                    }
                  }} className="bg-red-600 text-white px-4 py-2 rounded text-sm">Añadir</button>
                </div>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {muelles.map(m => (
                    <li key={m.id} className="p-2 bg-gray-100 rounded text-sm flex justify-between items-center">
                      {m.nombre}
                      <button onClick={() => {
                        fetch(`/api/muelles/${m.id}`, { method: 'DELETE' }).then(() => refreshData());
                      }} className="text-red-600 hover:text-red-800"><Delete size={16} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KioskApp() {
  const { logo } = useApp();
  const [view, setView] = useState<'menu' | 'entrada' | 'salida'>('menu');
  const [cedula, setCedula] = useState('');
  const [conductor, setConductor] = useState<any>(null);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [registros, setRegistros] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muelles, setMuelles] = useState<any[]>([]);
  const [muelle, setMuelle] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => setEmpresas(data));
    fetch('/api/registros')
      .then(res => res.json())
      .then(data => setRegistros(data));
    fetch('/api/conductores')
      .then(res => res.json())
      .then(data => setConductores(data));
    fetch('/api/muelles')
      .then(res => res.json())
      .then(data => setMuelles(data));
  }, []);

  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // updateLogo(base64String); // We'll use this in AdminApp instead
      };
      reader.readAsDataURL(file);
    }
  };

  const verificarAdmin = async () => {
    if (password === '1234') {
      setView('admin');
      await cargarEmpresas();
      setShowPasswordInput(false);
      setPassword('');
    } else {
      toast.error('Contraseña incorrecta');
    }
  };

  const handleKeypad = (key: string) => {
    if (key === 'DEL') setCedula(prev => prev.slice(0, -1));
    else if (key === 'OK') buscarConductor();
    else setCedula(prev => prev + key);
  };

  const registrarSalida = async (conductorId: string) => {
    setLoading(true);
    const response = await fetch('/api/registro-salida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.success) {
      toast.success(`Salida registrada. Permanencia: ${data.permanencia} minutos.`);
      // Refresh registros
      fetch('/api/registros')
        .then(res => res.json())
        .then(data => setRegistros(data));
      setView('menu');
      setCedula('');
      setConductor(null);
    } else {
      toast.error('No se encontró un registro activo para este conductor.');
    }
  };

  const buscarConductor = async () => {
    setLoading(true);
    const response = await fetch('/api/conductores');
    const conductores = await response.json();
    const encontrado = conductores.find((c: any) => c.cedula === cedula);
    setLoading(false);
    
    if (view === 'salida') {
      if (encontrado) {
        registrarSalida(encontrado.id);
      } else {
        toast.error('Conductor no encontrado');
      }
      return;
    }

    if (encontrado) {
      // Check for active registration
      const tieneRegistroActivo = registros.some(r => r.conductorId === encontrado.id && !r.salida);
      if (tieneRegistroActivo) {
        toast.error('El conductor ya tiene un registro activo sin salida.');
        return;
      }
      setConductor(encontrado);
      setMostrarRegistro(false);
    } else {
      setConductor(null);
      setMostrarRegistro(true);
    }
  };

  const registrarConductor = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const nuevoConductor = {
      cedula,
      nombre: (formData.get('nombre') as string).toUpperCase(),
      placa: (formData.get('placa') as string).toUpperCase(),
      empresa: (formData.get('empresa') as string).toUpperCase(),
    };
    
    await fetch('/api/conductores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoConductor),
    });
    
    setLoading(false);
    setConductor(nuevoConductor);
    setMostrarRegistro(false);
    toast.success('Conductor registrado exitosamente');
  };

  const registrarMuelle = async (tipo: 'Cargue' | 'Descargue') => {
    if (!conductor) {
        toast.error('Error: Conductor no encontrado');
        return;
    }
    setLoading(true);
    await fetch('/api/registro-muelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conductorId: conductor.id, tipo }),
    });
    setLoading(false);
    toast.success('Se ha creado correctamente el registro');
    // Refresh registros
    fetch('/api/registros')
      .then(res => res.json())
      .then(data => setRegistros(data));
    setView('menu');
    setCedula('');
    setConductor(null);
    setMuelle('');
  };

  const cargarEmpresas = async () => {
    const response = await fetch('/api/empresas');
    setEmpresas(await response.json());
  };

  const agregarEmpresa = async (nombre: string) => {
    setLoading(true);
    await fetch('/api/empresas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.toUpperCase() }),
    });
    setLoading(false);
    cargarEmpresas();
  };

  const exportarCSV = () => {
    const headers = ["Fecha,Nombre,Cedula,Transportadora,Placa,F. Entrada,F. Cargue,Muelle,Status,Tiempo Espera(min),Tiempo en Muelle(min),Tiempo Total Estadia(min)"];
    const rows = registros.map(r => {
      const conductor = conductores.find((c: any) => c.id === r.conductorId);
      const inicioCargue = r.inicioCargue ? new Date(r.inicioCargue).getTime() : null;
      const entrada = new Date(r.fecha).getTime();
      const tiempoEspera = inicioCargue ? Math.round((inicioCargue - entrada) / 60000) : 'N/A';
      
      return `${r.fecha},${conductor?.nombre || 'N/A'},${conductor?.cedula || 'N/A'},${conductor?.empresa || 'N/A'},${conductor?.placa || 'N/A'},${r.fecha},${r.finCargue || 'N/A'},${r.muelle || 'N/A'},${r.status || 'ESPERA'},${tiempoEspera},${r.tiempoCargue || 'N/A'},${r.permanencia || 'N/A'}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_detallado_muelles.csv");
    document.body.appendChild(link);
    link.click();
  };

  const cargarMuelles = async () => {
    const response = await fetch('/api/muelles');
    setMuelles(await response.json());
  };

  const agregarMuelle = async (nombre: string) => {
    setLoading(true);
    await fetch('/api/muelles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombre.toUpperCase() }),
    });
    setLoading(false);
    cargarMuelles();
  };

  const [showMuelleModal, setShowMuelleModal] = useState(false);
  const [registroAAsignar, setRegistroAAsignar] = useState<any>(null);

  const asignarMuelle = (registroId: any) => {
    setRegistroAAsignar(registroId);
    setShowMuelleModal(true);
  };

  const confirmarAsignacion = async (muelle: string) => {
    const response = await fetch('/api/asignar-muelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registroId: registroAAsignar, muelle }),
    });
    
    const data = await response.json();
    if (!data.success) {
        toast.error(data.message || 'Error al asignar muelle');
        // Refresh to ensure we have the latest state
        fetch('/api/registros')
          .then(res => res.json())
          .then(data => setRegistros(data));
        setShowMuelleModal(false);
        setRegistroAAsignar(null);
        return;
    }
    
    // Refresh registers
    fetch('/api/registros')
      .then(res => res.json())
      .then(data => setRegistros(data));
    
    setShowMuelleModal(false);
    setRegistroAAsignar(null);
  };

  const finCargue = async (registroId: any) => {
    await fetch('/api/fin-cargue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registroId }),
    });
    
    // Refresh registers
    fetch('/api/registros')
      .then(res => res.json())
      .then(data => setRegistros(data));
    toast.success('Cargue finalizado');
  };

  const borrarRegistro = async (registroId: number) => {
    console.log('Intentando borrar registro:', registroId);
    
    const response = await fetch(`/api/registros/${registroId}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    console.log('Resultado de borrado:', result);
    
    // Refresh registers
    fetch('/api/registros')
      .then(res => res.json())
      .then(data => setRegistros(data));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster richColors position="top-center" duration={2000} toastOptions={{ style: { fontSize: '1.5rem', padding: '2rem' }, className: 'text-2xl p-6' }} />
      {/* Header */}
      <header className="w-full bg-red-600 p-4 flex items-center gap-8">
        {logo && <img src={logo} alt="Logo" className="h-16 bg-white p-2 rounded-full" />}
        <h1 className="text-white text-3xl font-bold uppercase tracking-wide">Sistema de Gestión de Muelles</h1>
      </header>

      <main className="flex-grow p-8">
        {view === 'menu' && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-4">BIENVENIDOS</h2>
            <button onClick={() => { setView('entrada'); setCedula(''); setConductor(null); }} className="w-full max-w-md bg-gray-900 text-white py-6 rounded-2xl text-2xl font-bold hover:bg-gray-800 shadow-xl">Entrada a Planta</button>
            <button onClick={() => { setView('salida'); setCedula(''); setConductor(null); }} className="w-full max-w-md bg-white text-gray-900 py-6 rounded-2xl text-2xl font-bold border-4 border-gray-900 hover:bg-gray-50 shadow-xl">Salida de Fábrica</button>
            
            <div className="mt-20 text-gray-400 text-sm">
              Modo Kiosko - Colcafé
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setView('menu')} className="mb-6 border-2 border-gray-300 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="text-red-600" size={32} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Administración</h2>
            <div className="flex gap-4 mb-6">
              <button onClick={() => setView('monitor')} className="bg-blue-600 text-white py-4 px-6 rounded-xl font-bold">Monitor de Muelles</button>
              <button onClick={() => setView('dashboard')} className="bg-green-600 text-white py-4 px-6 rounded-xl font-bold">Dashboard</button>
              <button onClick={() => setView('reportes')} className="bg-purple-600 text-white py-4 px-6 rounded-xl font-bold">Reportes</button>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">Configuración</h2>
            <div className="mb-6 p-4 bg-gray-100 rounded-xl">
              <label className="block text-sm font-bold mb-2">Cargar Logo Corporativo</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700" />
            </div>

            <h2 className="text-2xl font-bold mb-6">Administración de Empresas</h2>
            <div className="flex gap-2 mb-6">
              <input id="nuevaEmpresa" className="flex-grow p-3 border rounded uppercase" placeholder="Nombre nueva empresa" />
              <button onClick={() => { 
                const input = document.getElementById('nuevaEmpresa') as HTMLInputElement;
                if(input.value) agregarEmpresa(input.value);
              }} disabled={loading} className="bg-red-600 text-white px-6 py-3 rounded disabled:opacity-50">Agregar</button>
            </div>
            <ul className="space-y-2 mb-6">
              {empresas.map(e => <li key={`${e.id}-${e.nombre}`} className="p-3 bg-gray-100 rounded">{e.nombre}</li>)}
            </ul>

            <h2 className="text-2xl font-bold mb-6">Administración de Muelles</h2>
            <div className="flex gap-2 mb-6">
              <input id="nuevoMuelle" className="flex-grow p-3 border rounded uppercase" placeholder="Nombre nuevo muelle" />
              <button onClick={() => { 
                const input = document.getElementById('nuevoMuelle') as HTMLInputElement;
                if(input.value) agregarMuelle(input.value);
              }} disabled={loading} className="bg-red-600 text-white px-6 py-3 rounded disabled:opacity-50">Agregar</button>
            </div>
            <ul className="space-y-2">
              {muelles.map(m => <li key={`${m.id}-${m.nombre}`} className="p-3 bg-gray-100 rounded">{m.nombre}</li>)}
            </ul>
          </div>
        )}

        {view === 'monitor' && (
          <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setView('admin')} className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
                <ArrowLeft size={24} />
                <span className="font-semibold">Volver</span>
              </button>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Monitor de Muelles</h2>
              <button onClick={exportarCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all">
                Exportar Reporte (CSV)
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Conductor</th>
                    <th className="px-6 py-4">Transportadora</th>
                    <th className="px-6 py-4">Placa</th>
                    <th className="px-6 py-4">Muelle</th>
                    <th className="px-6 py-4">T. Muelle (min)</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registros.filter(r => !r.salida).map(r => {
                    const conductor = conductores.find((c: any) => c.id === r.conductorId);
                    return (
                      <tr key={`${r.id}-${r.fecha}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{new Date(r.fecha).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{conductor?.nombre || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{conductor?.empresa || 'N/A'}</td>
                        <td className="px-6 py-4 font-mono text-gray-700">{conductor?.placa || 'N/A'}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">{r.muelle || '-'}</td>
                        <td className="px-6 py-4 text-gray-700">{r.tiempoCargue || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'CARGANDO' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                            {r.status || 'ESPERA'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          {r.status === 'CARGANDO' && (
                            <button onClick={() => finCargue(r.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-all">FIN CARGUE</button>
                          )}
                          {!r.muelle && (
                            <button onClick={() => asignarMuelle(r.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-all">ASIG. MUELLE</button>
                          )}
                          <button onClick={() => borrarRegistro(r.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-md text-xs font-semibold transition-all">BORRAR</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showMuelleModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
                  <h3 className="text-xl font-bold mb-6 text-gray-900">Seleccione Muelle</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {muelles.filter(m => !registros.some(r => r.muelle && r.muelle.trim().toUpperCase() === m.nombre.trim().toUpperCase() && !r.salida)).map(m => (
                      <button key={m.id} onClick={() => confirmarAsignacion(m.nombre)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold p-3 rounded-lg transition-all">{m.nombre}</button>
                    ))}
                  </div>
                  <button onClick={() => setShowMuelleModal(false)} className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold p-3 rounded-lg transition-all">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'dashboard' && (
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setView('admin')} className="mb-6 border-2 border-gray-300 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="text-red-600" size={32} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-bold mb-4">Registros por Tipo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[{name: 'Cargue', value: registros.filter(r => r.tipo === 'Cargue').length}, {name: 'Descargue', value: registros.filter(r => r.tipo === 'Descargue').length}]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div className="max-w-7xl mx-auto p-4">
            <button onClick={() => setView('admin')} className="mb-4 border-2 border-gray-300 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="text-red-600" size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-red-600 uppercase">Reportes de Cargue</h2>
            
            <div className="h-96 bg-white p-4 rounded-lg shadow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registros.filter(r => r.status === 'FIN CARGUE')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muelle" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tiempoCargue" fill="#8884d8" name="Tiempo Cargue (min)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {view === 'entrada' && (
          <div className="h-full">
            <button onClick={() => setView('menu')} className="mb-6 border-2 border-gray-300 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="text-red-600" size={32} />
            </button>
            <h2 className="text-center text-2xl text-gray-600 font-semibold mb-8">INGRESE SU DOCUMENTO</h2>
            
            <div className="grid grid-cols-2 gap-16">
              {/* Izquierda: Calculadora */}
              <div className="border-2 border-gray-300 p-4 rounded-lg">
                <div className="bg-gray-100 p-6 text-3xl font-bold text-right rounded mb-4 h-16">{cedula}</div>
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3,4,5,6,7,8,9].map(key => (
                    <button key={key} onClick={() => handleKeypad(String(key))} className="bg-gray-200 py-6 text-2xl font-bold rounded hover:bg-gray-300">
                      {key}
                    </button>
                  ))}
                  <button onClick={() => handleKeypad('DEL')} className="bg-gray-300 py-6 text-2xl font-bold rounded hover:bg-gray-400 flex items-center justify-center"><Delete /></button>
                  <button onClick={() => handleKeypad('0')} className="bg-gray-200 py-6 text-2xl font-bold rounded hover:bg-gray-300">0</button>
                  <button onClick={() => handleKeypad('OK')} disabled={loading} className="bg-green-600 text-white py-6 text-2xl font-bold rounded hover:bg-green-700 disabled:opacity-50">OK</button>
                </div>
              </div>

              {/* Derecha: Información o Registro */}
              <div className="space-y-6">
                {mostrarRegistro ? (
                  <form onSubmit={registrarConductor} className="space-y-4">
                    <h3 className="text-xl font-bold text-red-600">Registrar Nuevo Conductor</h3>
                    <input name="nombre" placeholder="Nombre Completo" required className="w-full p-3 border rounded uppercase" />
                    <input name="placa" placeholder="Placa Vehículo" required className="w-full p-3 border rounded uppercase" />
                    <select name="empresa" required className="w-full p-3 border rounded uppercase">
                      <option value="">Seleccione Empresa</option>
                      {empresas.map(e => <option key={`${e.id}-${e.nombre}`} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                    <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-3 rounded font-bold disabled:opacity-50">Registrar</button>
                  </form>
                ) : (
                  <>
                    <div>
                      <label className="text-gray-500 font-semibold">NOMBRE COMPLETO</label>
                      <div className="bg-gray-200 p-3 rounded h-12">{conductor?.nombre || ''}</div>
                    </div>
                    <div>
                      <label className="text-gray-500 font-semibold">PLACA VEHICULO</label>
                      <div className="bg-gray-200 p-3 rounded h-12">{conductor?.placa || ''}</div>
                    </div>
                    <div>
                      <label className="text-gray-500 font-semibold">EMPRESA TRANSPORTADORA</label>
                      <div className="bg-gray-200 p-3 rounded h-12">{conductor?.empresa || ''}</div>
                    </div>
                    {conductor && (
                      <>
                        <p className="text-center text-gray-500 pt-4">ACTIVIDAD A REALIZAR?</p>
                        <div className="flex gap-6">
                          <button onClick={() => registrarMuelle('Cargue')} disabled={loading} className="flex-1 bg-green-400 text-black py-4 rounded-lg font-bold border-2 border-gray-400 disabled:opacity-50">CARGUE</button>
                          <button onClick={() => registrarMuelle('Descargue')} disabled={loading} className="flex-1 bg-gray-200 text-black py-4 rounded-lg font-bold border-2 border-gray-400 disabled:opacity-50">DESCARGUE</button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'salida' && (
          <div className="h-full">
            <button onClick={() => setView('menu')} className="mb-6 border-2 border-gray-300 rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="text-red-600" size={32} />
            </button>
            <h2 className="text-center text-2xl text-gray-600 font-semibold mb-8">INGRESE SU DOCUMENTO PARA SALIDA</h2>
            
            <div className="flex justify-center">
              {/* Calculadora */}
              <div className="border-2 border-gray-300 p-4 rounded-lg w-full max-w-md">
                <div className="bg-gray-100 p-6 text-3xl font-bold text-right rounded mb-4 h-16">{cedula}</div>
                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3,4,5,6,7,8,9].map(key => (
                    <button key={key} onClick={() => handleKeypad(String(key))} className="bg-gray-200 py-6 text-2xl font-bold rounded hover:bg-gray-300">
                      {key}
                    </button>
                  ))}
                  <button onClick={() => handleKeypad('DEL')} className="bg-gray-300 py-6 text-2xl font-bold rounded hover:bg-gray-400 flex items-center justify-center"><Delete /></button>
                  <button onClick={() => handleKeypad('0')} className="bg-gray-200 py-6 text-2xl font-bold rounded hover:bg-gray-300">0</button>
                  <button onClick={() => handleKeypad('OK')} disabled={loading} className="bg-green-600 text-white py-6 text-2xl font-bold rounded hover:bg-green-700 disabled:opacity-50">OK</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
