import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface Jornada {
  numero: number;
  partido: string;
  resultado: string;
  pronosticos: {
    juan: string;
    maria: string;
    rober: string;
    juanocho: string;
  };
  puntos: {
    juan: number;
    maria: number;
    rober: number;
    juanocho: number;
  };
  turnos: string;
}

export interface Clasificacion {
  nombre: string;
  puntos: number;
  posicion: number;
}

export interface EstadsJugador {
  nombre: string;
  puntosTotales: number;
  puntosPromedio: number;
  jornadas: JornadaJugador[];
}

export interface JornadaJugador {
  numero: number;
  partido: string;
  resultado: string;
  pronostico: string;
  puntos: number;
}

@Injectable({
  providedIn: 'root'
})
export class SheetsService {
  private http = inject(HttpClient);
  private base = `https://sheets.googleapis.com/v4/spreadsheets/${environment.spreadsheetId}/values`;
  private key = `key=${environment.sheetsApiKey}`;

  getJornadas() {
    return this.http
      .get<any>(`${this.base}/Partidos?${this.key}`)
      .pipe(
        map(res => {
          const rows: string[][] = res.values.slice(1); // saltar cabecera
          return rows.map(row => ({
            numero: Number(row[0]),
            partido: row[1],
            resultado: row[2] || '',
            pronosticos: {
              juan: row[3] || '',
              maria: row[5] || '',
              rober: row[7] || '',
              juanocho: row[9] || '',
            },
            puntos: {
              juan: Number(row[4]) || 0,
              maria: Number(row[6]) || 0,
              rober: Number(row[8]) || 0,
              juanocho: Number(row[10]) || 0,
            },
            turnos: row[11] || ''
          } as Jornada));
        })
      );
  }

  getClasificacion() {
    return this.http
      .get<any>(`${this.base}/Clasificación?${this.key}`)
      .pipe(
        map(res => {
          const rows: string[][] = res.values.slice(1);
          return rows.map((row, index) => ({
            nombre: row[0],
            puntos: Number(row[1]),
            posicion: index + 1
          } as Clasificacion));
        })
      );
  }

  getEstadsJugador(nombre: string) {
    return this.getJornadas().pipe(
      map(jornadas => {
        // Normalizar nombre: minúsculas y remover acentos
        const normalizar = (str: string) => 
          str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        
        const nombreNormalizado = normalizar(nombre);
        const jugadores = ['juan', 'maria', 'rober', 'juanocho'];
        const key = jugadores.find(
          j => normalizar(j) === nombreNormalizado
        ) as keyof typeof jornadas[0]['puntos'] | undefined;

        if (!key) {
          throw new Error(`Jugador ${nombre} no encontrado`);
        }

        const jornadasJugador: JornadaJugador[] = jornadas.map(j => ({
          numero: j.numero,
          partido: j.partido,
          resultado: j.resultado,
          pronostico: j.pronosticos[key],
          puntos: j.puntos[key]
        }));

        const puntosTotales = jornadasJugador.reduce((sum, j) => sum + j.puntos, 0);
        const puntosPromedio = Math.round((puntosTotales / jornadasJugador.length) * 100) / 100;        

        return {
          nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
          puntosTotales,
          puntosPromedio,
          jornadas: jornadasJugador
        } as EstadsJugador;
      })
    );
  }

  guardarPronostico(numeroJornada: number, jugador: string, pronostico: string) {
  const railwayUrl = 'https://porra-depor-production.up.railway.app/guardarPronostico';
  
  return this.http.post<any>(railwayUrl, {
    numeroJornada,
    jugador,
    pronostico
  });
}
}
