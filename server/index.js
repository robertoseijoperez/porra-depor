require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Crear serviceAccount desde variable de entorno
let serviceAccount;

try {
  if (process.env.SERVICE_ACCOUNT_KEY) {
    // Si está en base64
    serviceAccount = JSON.parse(
      Buffer.from(process.env.SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8')
    );
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('SERVICE_ACCOUNT_KEY no está configurada');
  } else {
    // En desarrollo, usar el archivo local
    serviceAccount = require('./service-account-key.json');
  }
} catch (error) {
  console.error('Error al cargar credenciales:', error.message);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ✅ NUEVO: Mapeo de temporadas a spreadsheetIds
const TEMPORADAS_MAP = {
  '2025-2026': '1dH9oGyl5kSkSIl9a7yyVKLi3_NFMOuXTMGNeJczmkrQ',
  '2026-2027': '19HmZSzdhfMP1HgGReU6HwiQCn5lc8fRu95aCrHKt2OQ',
};

// Para retrocompatibilidad (si no se envía temporada)
const SPREADSHEET_ID_DEFAULT = '1dH9oGyl5kSkSIl9a7yyVKLi3_NFMOuXTMGNeJczmkrQ';

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    temporadas: Object.keys(TEMPORADAS_MAP)
  });
});

/**
 * Endpoint para guardar pronóstico
 * 
 * Parámetros esperados en el body:
 * - numeroJornada: número de jornada (1-38)
 * - jugador: nombre del jugador (juan, maria, rober, juanocho)
 * - pronostico: predicción (ej: "2-1")
 * - temporada: (NUEVO) temporada activa (ej: "2025-2026" o "2026-2027")
 *
 * Ejemplo:
 * POST /guardarPronostico
 * {
 *   "numeroJornada": 5,
 *   "jugador": "rober",
 *   "pronostico": "2-1",
 *   "temporada": "2026-2027"
 * }
 */
app.post('/guardarPronostico', async (req, res) => {
  try {
    const { numeroJornada, jugador, pronostico, temporada } = req.body;

    console.log('Solicitud recibida:', { numeroJornada, jugador, pronostico, temporada });

    // Validar datos requeridos
    if (!numeroJornada || !jugador || !pronostico) {
      return res.status(400).json({ error: 'Datos incompletos: se requieren numeroJornada, jugador y pronostico' });
    }

    // ✅ NUEVO: Resolver spreadsheetId desde temporada
    let spreadsheetId;
    
    if (temporada) {
      // Si se proporciona temporada, validar que exista
      if (!TEMPORADAS_MAP[temporada]) {
        return res.status(400).json({ 
          error: `Temporada no válida. Opciones disponibles: ${Object.keys(TEMPORADAS_MAP).join(', ')}`
        });
      }
      spreadsheetId = TEMPORADAS_MAP[temporada];
      console.log(`Usando spreadsheet para temporada ${temporada}`);
    } else {
      // Retrocompatibilidad: si no se envía temporada, usar la por defecto
      spreadsheetId = SPREADSHEET_ID_DEFAULT;
      console.log('No se especificó temporada, usando la por defecto');
    }

    // Mapeo de jugadores a columnas
    const columnasMap = {
      juan: 'D',
      maria: 'F',
      rober: 'H',
      juanocho: 'J',
    };

    const columna = columnasMap[jugador.toLowerCase()];
    if (!columna) {
      return res.status(400).json({ error: 'Jugador no reconocido. Opciones: juan, maria, rober, juanocho' });
    }

    // Calcular fila (numeroJornada + 1 porque la fila 1 es header)
    const fila = numeroJornada + 1;
    const range = `Partidos!${columna}${fila}`;

    console.log('Escribiendo en:', range, 'valor:', pronostico, 'spreadsheet:', spreadsheetId);

    // Guardar en Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[pronostico]],
      },
    });

    console.log('Pronóstico guardado exitosamente');
    res.json({ 
      success: true, 
      message: 'Pronóstico guardado',
      datos: {
        temporada: temporada || '2025-2026 (por defecto)',
        jugador,
        jornada: numeroJornada,
        pronostico
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ✅ NUEVO: Endpoint para obtener temporadas disponibles
 * 
 * Ejemplo:
 * GET /temporadas
 * 
 * Respuesta:
 * {
 *   "temporadas": ["2025-2026", "2026-2027"]
 * }
 */
app.get('/temporadas', (req, res) => {
  res.json({ 
    temporadas: Object.keys(TEMPORADAS_MAP),
    descripcion: 'Lista de temporadas disponibles en la aplicación'
  });
});

/**
 * ✅ NUEVO: Endpoint de health check extendido
 * 
 * Verifica que el servidor pueda conectar a Google Sheets
 */
app.get('/health', async (req, res) => {
  try {
    // Intentar una operación mínima en la primera hoja
    const testSpreadsheet = TEMPORADAS_MAP['2026-2027'];
    
    await sheets.spreadsheets.get({
      spreadsheetId: testSpreadsheet,
      fields: 'spreadsheetId'
    });

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      temporadas: Object.keys(TEMPORADAS_MAP),
      googleSheetsConnection: 'ok'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
  console.log(`Temporadas disponibles: ${Object.keys(TEMPORADAS_MAP).join(', ')}`);
  console.log(`Health check: GET http://localhost:${PORT}/health`);
});

/**
 * CAMBIOS REALIZADOS:
 * 
 * ✅ Mapeo de temporadas
 *    const TEMPORADAS_MAP = { ... }
 *    Mapea nombres de temporada a spreadsheetIds
 * 
 * ✅ Parámetro "temporada" en el endpoint
 *    El frontend envía la temporada activa
 *    El servidor resuelve el spreadsheetId correcto
 * 
 * ✅ Validación de temporada
 *    Si la temporada no existe, error 400
 * 
 * ✅ Retrocompatibilidad
 *    Si no se envía temporada, usa la por defecto (2025-26)
 * 
 * ✅ Nuevo endpoint GET /temporadas
 *    Retorna lista de temporadas disponibles
 * 
 * ✅ Nuevo endpoint GET /health
 *    Verifica que el servidor pueda conectar a Google Sheets
 * 
 * CÓMO USAR DESDE EL FRONTEND:
 * 
 * savePrediction(prediccion: Prediction): Observable<any> {
 *   const spreadsheetId = this.sheetContext.spreadsheetIdActual();
 *   const temporadaActual = this.sheetContext.temporadaActual();
 *   
 *   return this.http.post('http://localhost:3000/guardarPronostico', {
 *     numeroJornada: prediccion.jornada,
 *     jugador: prediccion.jugador,
 *     pronostico: prediccion.prediccion,
 *     temporada: temporadaActual.year  // ← ENVIAR LA TEMPORADA
 *   });
 * }
 */
