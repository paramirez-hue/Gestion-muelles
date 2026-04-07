import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Monitor({ registros, conductores, finCargue, asignarMuelle, borrarRegistro, showMuelleModal, muelles, confirmarAsignacion, setShowMuelleModal, hideHeader = false }: any) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Monitor de Muelles</h2>
        </div>
      )}
      
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
            {registros.filter((r: any) => !r.salida).map((r: any) => {
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
              {muelles.filter((m: any) => !registros.some((r: any) => r.muelle && r.muelle.trim().toUpperCase() === m.nombre.trim().toUpperCase() && !r.salida)).map((m: any) => (
                <button key={m.id} onClick={() => confirmarAsignacion(m.nombre)} className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold p-3 rounded-lg transition-all">{m.nombre}</button>
              ))}
            </div>
            <button onClick={() => setShowMuelleModal(false)} className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold p-3 rounded-lg transition-all">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
