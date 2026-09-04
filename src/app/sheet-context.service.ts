import { Injectable, signal, computed } from '@angular/core';

export interface Temporada {
  year: string;
  spreadsheetId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SheetContextService {
  // Definición de temporadas disponibles
  private TEMPORADAS: Temporada[] = [
    { 
      year: '2025-2026', 
      spreadsheetId: '1dH9oGyl5kSkSIl9a7yyVKLi3_NFMOuXTMGNeJczmkrQ'        
    },
    { 
      year: '2026-2027', 
      spreadsheetId: '19HmZSzdhfMP1HgGReU6HwiQCn5lc8fRu95aCrHKt2OQ' 
    }
  ];

  // Signal con el índice de temporada activa
  private temporadaActualIndex = signal(1); // Comienza con 2026-27

  // Computed: temporada actual basada en index
  temporadaActual = computed(() => 
    this.TEMPORADAS[this.temporadaActualIndex()]
  );

  // Computed: spreadsheetId actual (para comodidad)
  spreadsheetIdActual = computed(() => 
    this.temporadaActual().spreadsheetId
  );

  // Getter para todas las temporadas
  get temporadas(): Temporada[] {
    return this.TEMPORADAS;
  }

  /**
   * Cambia la temporada activa por índice
   */
  cambiarTemporada(indice: number): void {
    if (indice >= 0 && indice < this.TEMPORADAS.length) {
      this.temporadaActualIndex.set(indice);
    }
  }

  /**
   * Obtiene el índice actual
   */
  getTemporadaActualIndex(): number {
    return this.temporadaActualIndex();
  }

  /**
   * Navega a temporada anterior
   */
  irATemporadaAnterior(): void {
    const actual = this.temporadaActualIndex();
    if (actual > 0) {
      this.cambiarTemporada(actual - 1);
    }
  }

  /**
   * Navega a temporada siguiente
   */
  irATemporadaSiguiente(): void {
    const actual = this.temporadaActualIndex();
    if (actual < this.TEMPORADAS.length - 1) {
      this.cambiarTemporada(actual + 1);
    }
  }

  /**
   * Retorna todos los datos de la temporada actual
   */
  getTemporadaActual(): Temporada {
    return this.temporadaActual();
  }
}
