import React, { useState, useEffect } from 'react';
import { ArrowLeft, Delete, LogOut, LayoutDashboard, FileText, Settings, Monitor as MonitorIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Monitor from './Monitor';
import { db, updateDoc, doc, auth, signInWithPopup, googleProvider } from './firebase';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster richColors position="top-center" />
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

  const asignarMuelle = (registroId: any) => {
    setRegistroAAsignar(registroId);
    setShowMuelleModal(true);
  };

  const confirmarAsignacion = async (muelle: string) => {
    try {
      await updateDoc(doc(db, 'registros', registroAAsignar), {
        muelle,
        status: 'CARGANDO'
      });
      setShowMuelleModal(false);
      setRegistroAAsignar(null);
    } catch (error) {
      toast.error('Error al asignar muelle');
    }
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
  const { registros, conductores, muelles, empresas, logo, updateLogo, addEmpresa, addMuelle, deleteMuelle } = useApp();
  const [view, setView] = useState<'menu' | 'dashboard' | 'reportes' | 'config'>('menu');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      toast.error('Error al iniciar sesión');
    }
  };

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

  const handleAddEmpresa = () => {
    const input = document.getElementById('nuevaEmpresaAdmin') as HTMLInputElement;
    if (input.value) {
      addEmpresa(input.value.toUpperCase());
      input.value = '';
    }
  };

  const handleAddMuelle = () => {
    const input = document.getElementById('nuevoMuelleAdmin') as HTMLInputElement;
    if (input.value) {
      addMuelle(input.value.toUpperCase());
      input.value = '';
    }
  };

  const isAdmin = user?.email === "paramirez@serviciosnutresa.com";

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-6">Acceso Administrativo</h2>
          <p className="text-gray-600 mb-8">Debes iniciar sesión con tu cuenta autorizada para acceder al panel.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            Iniciar Sesión con Google
          </button>
          {user && !isAdmin && <p className="mt-4 text-red-500 font-semibold">Esta cuenta no tiene permisos de administrador.</p>}
          <Link to="/" className="block text-center mt-6 text-gray-500 underline">Volver al Kiosko</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          {logo && <img src={logo} alt="Logo" className="h-10 bg-white p-1 rounded" />}
          <h1 className="text-xl font-bold tracking-tight">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Usuario</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <button onClick={() => auth.signOut()} className="flex items-center gap-2 bg-gray-800 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => setView('dashboard')} className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="bg-green-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="text-green-600" size={40} />
              </div>
              <span className="font-bold text-xl text-gray-800">Dashboard</span>
            </button>
            <button onClick={() => setView('reportes')} className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="bg-purple-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <FileText className="text-purple-600" size={40} />
              </div>
              <span className="font-bold text-xl text-gray-800">Reportes</span>
            </button>
            <button onClick={() => setView('config')} className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="bg-blue-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Settings className="text-blue-600" size={40} />
              </div>
              <span className="font-bold text-xl text-gray-800">Configuración</span>
            </button>
            <Link to="/monitor" className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="bg-red-100 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <MonitorIcon className="text-red-600" size={40} />
              </div>
              <span className="font-bold text-xl text-gray-800">Ver Monitor</span>
            </Link>
          </div>
        )}

        {view !== 'menu' && (
          <button onClick={() => setView('menu')} className="mb-8 flex items-center gap-2 text-gray-600 hover:text-red-600 font-semibold transition-colors">
            <ArrowLeft size={20} /> Volver al Menú
          </button>
        )}

        {view === 'dashboard' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Estadísticas de Operación</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Cargue', value: registros.filter((r: any) => r.tipo === 'Cargue').length },
                  { name: 'Descargue', value: registros.filter((r: any) => r.tipo === 'Descargue').length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {view === 'reportes' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Reportes de Actividad</h2>
            <p className="text-gray-500 mb-8">Aquí podrás descargar y visualizar los reportes detallados de la operación.</p>
            {/* Implementación de tabla de reportes o descarga CSV */}
            <div className="text-center p-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              Próximamente: Exportación avanzada de datos
            </div>
          </div>
        )}

        {view === 'config' && (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Identidad Visual</h2>
              <div className="flex items-center gap-8">
                <div className="h-32 w-32 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden">
                  {logo ? <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain p-4" /> : <span className="text-gray-400 text-xs">Sin Logo</span>}
                </div>
                <div className="flex-grow">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cambiar Logo Corporativo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" 
                  />
                  <p className="mt-2 text-xs text-gray-400">Se recomienda formato PNG o JPG con fondo blanco o transparente.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Empresas Transportadoras</h2>
                <div className="flex gap-2 mb-6">
                  <input id="nuevaEmpresaAdmin" className="flex-grow p-3 border border-gray-200 rounded-xl uppercase text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Nueva empresa" />
                  <button onClick={handleAddEmpresa} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">Añadir</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {empresas.map((e: any) => (
                    <div key={e.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                      <span className="font-medium text-gray-700">{e.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Muelles de Operación</h2>
                <div className="flex gap-2 mb-6">
                  <input id="nuevoMuelleAdmin" className="flex-grow p-3 border border-gray-200 rounded-xl uppercase text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="Nuevo muelle" />
                  <button onClick={handleAddMuelle} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">Añadir</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {muelles.map((m: any) => (
                    <div key={m.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                      <span className="font-medium text-gray-700">{m.nombre}</span>
                      <button onClick={() => deleteMuelle(m.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <Delete size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KioskApp() {
  const { logo, conductores, empresas, addRegistro, addConductor, registros } = useApp();
  const [view, setView] = useState<'menu' | 'entrada' | 'salida'>('menu');
  const [cedula, setCedula] = useState('');
  const [conductor, setConductor] = useState<any>(null);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeypad = (val: string) => {
    if (val === 'DEL') setCedula(cedula.slice(0, -1));
    else if (val === 'OK') {
      if (view === 'salida') handleSalida();
      else buscarConductor();
    }
    else if (cedula.length < 10) setCedula(cedula + val);
  };

  const buscarConductor = () => {
    if (!cedula) return;
    const found = conductores.find((c: any) => c.cedula === cedula);
    if (found) {
      setConductor(found);
      setMostrarRegistro(false);
    } else {
      setConductor(null);
      setMostrarRegistro(true);
    }
  };

  const registrarConductor = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const nuevoConductor = {
      cedula,
      nombre: (formData.get('nombre') as string).toUpperCase(),
      placa: (formData.get('placa') as string).toUpperCase(),
      empresa: (formData.get('empresa') as string).toUpperCase(),
    };
    setLoading(true);
    try {
      await addConductor(nuevoConductor);
      setConductor(nuevoConductor);
      setMostrarRegistro(false);
    } catch (error) {
      toast.error('Error al registrar conductor');
    }
    setLoading(false);
  };

  const registrarMuelle = async (tipo: string) => {
    setLoading(true);
    try {
      await addRegistro({
        conductorId: conductor.cedula,
        tipo,
      });
      setView('menu');
      setCedula('');
      setConductor(null);
    } catch (error) {
      toast.error('Error al registrar muelle');
    }
    setLoading(false);
  };

  const handleSalida = async () => {
    if (!cedula) return;
    const activeRecord = registros.find((r: any) => r.conductorId === cedula && !r.salida);
    if (activeRecord) {
      try {
        await updateDoc(doc(db, 'registros', activeRecord.id), {
          salida: new Date().toISOString(),
          status: 'FIN CARGUE'
        });
        toast.success('Salida registrada');
        setView('menu');
        setCedula('');
      } catch (error) {
        toast.error('Error al registrar salida');
      }
    } else {
      toast.error('No se encontró registro activo');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full bg-red-600 p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-8">
          {logo && <img src={logo} alt="Logo" className="h-16 bg-white p-2 rounded-2xl shadow-sm" />}
          <h1 className="text-white text-3xl font-black uppercase tracking-tighter">Sistema de Gestión de Muelles</h1>
        </div>
        <Link to="/admin" className="text-red-500 hover:text-white opacity-10 hover:opacity-100 transition-all p-2">
          <Settings size={24} />
        </Link>
      </header>

      <main className="flex-grow flex flex-col p-8">
        {view === 'menu' && (
          <div className="flex-grow flex flex-col items-center justify-center gap-10">
            <div className="text-center">
              <h2 className="text-6xl font-black text-gray-900 mb-2 tracking-tighter">BIENVENIDOS</h2>
              <p className="text-xl text-gray-500 font-medium">Seleccione la operación a realizar</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
              <button 
                onClick={() => { setView('entrada'); setCedula(''); setConductor(null); }} 
                className="bg-gray-900 text-white p-16 rounded-3xl text-4xl font-black hover:bg-gray-800 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                ENTRADA A PLANTA
              </button>
              <button 
                onClick={() => { setView('salida'); setCedula(''); setConductor(null); }} 
                className="bg-white text-gray-900 p-16 rounded-3xl text-4xl font-black border-8 border-gray-900 hover:bg-gray-50 shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                SALIDA DE FÁBRICA
              </button>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="h-px w-20 bg-gray-200"></div>
              <span className="text-gray-400 font-bold tracking-widest text-xs uppercase">Modo Kiosko - Colcafé</span>
              <div className="h-px w-20 bg-gray-200"></div>
            </div>
          </div>
        )}

        {(view === 'entrada' || view === 'salida') && (
          <div className="max-w-6xl mx-auto w-full">
            <button onClick={() => setView('menu')} className="mb-10 flex items-center gap-3 text-gray-400 hover:text-red-600 font-bold transition-colors">
              <ArrowLeft size={32} /> <span className="text-2xl">VOLVER</span>
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Teclado Numérico */}
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-inner">
                <h3 className="text-center text-xl font-bold text-gray-400 mb-6 uppercase tracking-widest">Ingrese Documento</h3>
                <div className="bg-white p-8 text-5xl font-black text-center rounded-2xl mb-8 h-24 flex items-center justify-center border-4 border-gray-900 shadow-sm">{cedula}</div>
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3,4,5,6,7,8,9].map(key => (
                    <button key={key} onClick={() => handleKeypad(String(key))} className="bg-white py-8 text-3xl font-black rounded-2xl shadow-sm hover:bg-gray-900 hover:text-white transition-all active:scale-90 border border-gray-100">
                      {key}
                    </button>
                  ))}
                  <button onClick={() => handleKeypad('DEL')} className="bg-red-50 text-red-600 py-8 text-3xl font-black rounded-2xl shadow-sm hover:bg-red-600 hover:text-white transition-all active:scale-90 flex items-center justify-center"><Delete size={40} /></button>
                  <button onClick={() => handleKeypad('0')} className="bg-white py-8 text-3xl font-black rounded-2xl shadow-sm hover:bg-gray-900 hover:text-white transition-all active:scale-90 border border-gray-100">0</button>
                  <button onClick={() => handleKeypad('OK')} disabled={loading} className="bg-green-600 text-white py-8 text-3xl font-black rounded-2xl shadow-sm hover:bg-green-700 transition-all active:scale-90 disabled:opacity-50">OK</button>
                </div>
              </div>

              {/* Información / Formulario */}
              <div className="flex flex-col justify-center">
                {mostrarRegistro ? (
                  <div className="bg-white p-10 rounded-3xl border-4 border-red-600 shadow-2xl">
                    <h3 className="text-3xl font-black text-red-600 mb-8 uppercase tracking-tighter">Nuevo Conductor</h3>
                    <form onSubmit={registrarConductor} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                        <input name="nombre" required className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold uppercase focus:border-red-600 outline-none transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Placa Vehículo</label>
                        <input name="placa" required className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold uppercase focus:border-red-600 outline-none transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Empresa Transportadora</label>
                        <select name="empresa" required className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold uppercase focus:border-red-600 outline-none transition-colors">
                          <option value="">Seleccione Empresa</option>
                          {empresas.map((e: any) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                        </select>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-6 rounded-2xl text-2xl font-black shadow-lg hover:bg-red-700 transition-all disabled:opacity-50">REGISTRAR CONDUCTOR</button>
                    </form>
                  </div>
                ) : conductor ? (
                  <div className="bg-white p-10 rounded-3xl border-4 border-gray-900 shadow-2xl space-y-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <MonitorIcon className="text-green-600" size={32} />
                      </div>
                      <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Datos Confirmados</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Nombre</p>
                        <p className="text-2xl font-black text-gray-900">{conductor.nombre}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Placa</p>
                          <p className="text-2xl font-black text-gray-900">{conductor.placa}</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Empresa</p>
                          <p className="text-xl font-black text-gray-900 truncate">{conductor.empresa}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      <p className="text-center font-black text-gray-400 text-sm uppercase tracking-widest">¿Qué actividad realizará?</p>
                      <div className="grid grid-cols-2 gap-6">
                        <button onClick={() => registrarMuelle('Cargue')} disabled={loading} className="bg-green-600 text-white py-8 rounded-2xl text-3xl font-black shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50">CARGUE</button>
                        <button onClick={() => registrarMuelle('Descargue')} disabled={loading} className="bg-gray-900 text-white py-8 rounded-2xl text-3xl font-black shadow-lg hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50">DESCARGUE</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-20 text-center">
                    <div className="bg-gray-100 p-10 rounded-full mb-6">
                      <MonitorIcon className="text-gray-300" size={80} />
                    </div>
                    <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Esperando Documento...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
