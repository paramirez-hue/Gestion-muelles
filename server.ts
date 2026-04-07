import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Google Sheets Config (You will need to set these in .env)
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

const auth = new GoogleAuth({
  keyFile: path.join(__dirname, 'google-credentials.json'), // You need to upload this file
  scopes: 'https://www.googleapis.com/auth/spreadsheets',
});

const sheets = google.sheets({ version: 'v4', auth });

async function appendToSheet(range: string, values: any[]) {
  if (!SPREADSHEET_ID) return;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  } catch (err) {
    console.error('Error appending to sheet:', err);
  }
}

app.use(express.json());

// ... (código existente hasta la inicialización de la base de datos)
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ conductores: [], muelles: [], empresas: [], registros: [], config: { logo: null } }));
}

// ... (lectura y escritura de DB)

const readDb = () => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    return { 
      conductores: data.conductores || [], 
      muelles: data.muelles || [], 
      empresas: data.empresas || [], 
      registros: data.registros || [],
      config: data.config || { logo: null }
    };
  } catch (e) {
    return { conductores: [], muelles: [], empresas: [], registros: [], config: { logo: null } };
  }
};
const writeDb = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// API Endpoints
// Config
app.get('/api/config', (req, res) => res.json(readDb().config));
app.post('/api/config/logo', (req, res) => {
  const db = readDb();
  db.config.logo = req.body.logo;
  writeDb(db);
  res.json({ success: true });
});

// Conductores
app.get('/api/conductores', (req, res) => res.json(readDb().conductores));
app.post('/api/conductores', (req, res) => {
  const db = readDb();
  const nuevo = { ...req.body, id: Date.now() };
  db.conductores.push(nuevo);
  writeDb(db);
  res.json(nuevo);
});

// Empresas
app.get('/api/empresas', (req, res) => res.json(readDb().empresas));
app.post('/api/empresas', (req, res) => {
  const db = readDb();
  db.empresas.push({ nombre: req.body.nombre, id: Date.now() });
  writeDb(db);
  res.json({ success: true });
});

// Muelles
app.get('/api/muelles', (req, res) => res.json(readDb().muelles));
app.post('/api/muelles', (req, res) => {
  const db = readDb();
  db.muelles.push({ nombre: req.body.nombre, id: Date.now() });
  writeDb(db);
  res.json({ success: true });
});
app.delete('/api/muelles/:id', (req, res) => {
  const db = readDb();
  db.muelles = db.muelles.filter(m => m.id !== parseInt(req.params.id));
  writeDb(db);
  res.json({ success: true });
});

// Registro Muelle
app.get('/api/registros', (req, res) => res.json(readDb().registros));
app.post('/api/registro-muelle', (req, res) => {
  const db = readDb();
  const nuevoRegistro = { ...req.body, id: Date.now(), fecha: new Date().toISOString(), status: 'ESPERA' };
  db.registros.push(nuevoRegistro);
  writeDb(db);
  
  // Append to Sheet
  appendToSheet('Registros!A:E', [
    nuevoRegistro.id,
    nuevoRegistro.fecha,
    nuevoRegistro.conductorId,
    nuevoRegistro.empresa,
    nuevoRegistro.status
  ]);

  res.json({ success: true });
});

app.post('/api/asignar-muelle', (req, res) => {
  const db = readDb();
  const { registroId, muelle } = req.body;
  
  const muelleOcupado = db.registros.some(r => r.muelle === muelle && !r.salida);
  if (muelleOcupado) {
    return res.status(400).json({ success: false, message: 'Muelle ya ocupado' });
  }

  const registroIndex = db.registros.findIndex(r => r.id === parseInt(registroId));
  if (registroIndex !== -1) {
    db.registros[registroIndex] = { 
      ...db.registros[registroIndex], 
      muelle, 
      status: 'CARGANDO',
      inicioCargue: new Date().toISOString() 
    };
    writeDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Registro no encontrado' });
  }
});

app.post('/api/fin-cargue', (req, res) => {
  const db = readDb();
  const { registroId } = req.body;
  const registroIndex = db.registros.findIndex(r => r.id === parseInt(registroId));
  
  if (registroIndex !== -1) {
    const registro = db.registros[registroIndex];
    if (!registro.inicioCargue) {
        return res.status(400).json({ success: false, message: 'No se ha registrado inicio de cargue' });
    }
    const finCargue = new Date();
    const inicioCargue = new Date(registro.inicioCargue); 
    const tiempoCargue = Math.round((finCargue.getTime() - inicioCargue.getTime()) / 60000);
    
    db.registros[registroIndex] = { 
      ...registro, 
      status: 'FIN CARGUE', 
      finCargue: finCargue.toISOString(), 
      tiempoCargue 
    };
    writeDb(db);
    res.json({ success: true, tiempoCargue });
  } else {
    res.status(404).json({ success: false, message: 'Registro no encontrado' });
  }
});

app.post('/api/registro-salida', (req, res) => {
  const db = readDb();
  const registroIndex = db.registros.findIndex(r => r.conductorId === req.body.conductorId && !r.salida);
  if (registroIndex !== -1) {
    const registro = db.registros[registroIndex];
    
    // Check if status is 'CARGANDO'
    if (registro.status === 'CARGANDO') {
      return res.status(400).json({ success: false, message: 'El conductor está en proceso de cargue y no puede salir.' });
    }

    const salida = new Date();
    const entrada = new Date(registro.fecha);
    const permanencia = Math.round((salida.getTime() - entrada.getTime()) / 60000);
    const registroFinal = { ...registro, salida: salida.toISOString(), permanencia };
    db.registros[registroIndex] = registroFinal;
    writeDb(db);
    
    // Append to Sheet
    appendToSheet('Registros!A:I', [
      registroFinal.id,
      registroFinal.fecha,
      registroFinal.conductorId,
      registroFinal.empresa,
      registroFinal.muelle,
      registroFinal.status,
      registroFinal.salida,
      registroFinal.permanencia,
      'FINALIZADO'
    ]);

    res.json({ success: true, permanencia });
  } else {
    res.json({ success: false, message: 'Registro no encontrado o ya finalizado' });
  }
});

app.delete('/api/registros/:id', (req, res) => {
  const db = readDb();
  const id = parseInt(req.params.id);
  console.log('Borrar registro recibido:', req.params.id, 'parseado:', id);
  db.registros = db.registros.filter(r => r.id !== id);
  writeDb(db);
  res.json({ success: true, deletedId: id });
});
// ... (resto del código del servidor)

// Vite middleware
import { createServer as createViteServer } from 'vite';
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();
