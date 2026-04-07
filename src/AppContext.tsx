import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  db, auth, onSnapshot, collection, query, where, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp, getDocs, getDoc 
} from './firebase';

const AppContext = createContext<any>(null);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [muelles, setMuelles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    // Listen to Registros
    const unsubRegistros = onSnapshot(collection(db, 'registros'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistros(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'registros'));

    // Listen to Conductores
    const unsubConductores = onSnapshot(collection(db, 'conductores'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConductores(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'conductores'));

    // Listen to Muelles
    const unsubMuelles = onSnapshot(collection(db, 'muelles'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMuelles(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'muelles'));

    // Listen to Empresas
    const unsubEmpresas = onSnapshot(collection(db, 'empresas'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmpresas(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'empresas'));

    // Listen to Config
    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setLogo(snapshot.data().logo);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/global'));

    return () => {
      unsubRegistros();
      unsubConductores();
      unsubMuelles();
      unsubEmpresas();
      unsubConfig();
    };
  }, [isAuthReady]);

  const refreshData = () => {
    // onSnapshot handles real-time updates, but we can keep this for compatibility if needed
  };

  const finCargue = async (registroId: string) => {
    try {
      await updateDoc(doc(db, 'registros', registroId), {
        status: 'FIN CARGUE',
        salida: new Date().toISOString(),
        // Calculate time if needed, or do it in the UI
      });
      toast.success('Cargue finalizado');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `registros/${registroId}`);
    }
  };

  const borrarRegistro = async (registroId: string) => {
    try {
      await deleteDoc(doc(db, 'registros', registroId));
      toast.success('Registro eliminado');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registros/${registroId}`);
    }
  };

  const updateLogo = async (newLogo: string) => {
    try {
      await setDoc(doc(db, 'config', 'global'), { logo: newLogo }, { merge: true });
      setLogo(newLogo);
      toast.success('Logo actualizado');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'config/global');
    }
  };

  const addEmpresa = async (nombre: string) => {
    try {
      await addDoc(collection(db, 'empresas'), { nombre, createdAt: serverTimestamp() });
      toast.success('Empresa añadida');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'empresas');
    }
  };

  const addMuelle = async (nombre: string) => {
    try {
      await addDoc(collection(db, 'muelles'), { nombre, createdAt: serverTimestamp() });
      toast.success('Muelle añadido');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'muelles');
    }
  };

  const deleteMuelle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'muelles', id));
      toast.success('Muelle eliminado');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `muelles/${id}`);
    }
  };

  const addRegistro = async (registro: any) => {
    try {
      await addDoc(collection(db, 'registros'), {
        ...registro,
        fecha: new Date().toISOString(),
        entrada: new Date().toISOString(),
        status: 'ESPERA'
      });
      toast.success('Registro exitoso');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registros');
    }
  };

  const addConductor = async (conductor: any) => {
    try {
      await setDoc(doc(db, 'conductores', conductor.cedula), {
        ...conductor,
        createdAt: serverTimestamp()
      });
      toast.success('Conductor registrado');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conductores/${conductor.cedula}`);
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
