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
const SPREADSHEET_ID = '1dH9oGyl5kSkSIl9a7yyVKLi3_NFMOuXTMGNeJczmkrQ';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint para guardar pronóstico
app.post('/guardarPronostico', async (req, res) => {
  try {
    const { numeroJornada, jugador, pronostico } = req.body;

    console.log('Solicitud recibida:', { numeroJornada, jugador, pronostico });

    if (!numeroJornada || !jugador || !pronostico) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const columnasMap = {
      juan: 'D',
      maria: 'F',
      rober: 'H',
      juanocho: 'J',
    };

    const columna = columnasMap[jugador.toLowerCase()];
    if (!columna) {
      return res.status(400).json({ error: 'Jugador no reconocido' });
    }

    const fila = numeroJornada + 1;
    const range = `Partidos!${columna}${fila}`;

    console.log('Escribiendo en:', range, 'valor:', pronostico);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[pronostico]],
      },
    });

    console.log('Pronóstico guardado exitosamente');
    res.json({ success: true, message: 'Pronóstico guardado' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});