import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SheetsService, EstadsJugador, JornadaJugador, Clasificacion } from '../sheets';
import { SheetContextService } from '../sheet-context.service';

@Component({
  selector: 'app-jugador-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './jugador-detail.html',
  styleUrl: './jugador-detail.css'
})
export class JugadorDetailComponent implements OnInit {
  private sheetsService = inject(SheetsService);
  private sheetContext = inject(SheetContextService);
  private route = inject(ActivatedRoute);  

  protected stats = signal<EstadsJugador | null>(null);
  protected cargando = signal(true);
  protected error = signal(false);
  protected nombreJugador = signal('');
  protected fotoPerfil = signal('');
  protected clasificacion = signal<Clasificacion[]>([]);

  private setupEffect = effect(() => {
    const nombre = this.nombreJugador();
    this.sheetContext.spreadsheetIdActual();
    
    if (nombre) {
      this.fotoPerfil.set(this.construirRutaFoto(nombre));
      this.nombreJugador.set(nombre);
      this.cargarStats(nombre);
    }
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const nombre = params.get('nombre');

      if (nombre) {
        this.nombreJugador.set(nombre);
      }

    });    
  }

  private construirRutaFoto(nombre: string): string {
    const normalizar = (str: string) => 
          str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        
        const nombreNormalizado = normalizar(nombre);

        console.debug("nombre: " + nombre );
        console.debug("nombreNormalizado: " + nombreNormalizado);

    return `assets/players/${nombreNormalizado}.jpg`;
  }

  private cargarStats(nombre: string) {
    this.cargando.set(true);
    this.error.set(false);

    this.sheetsService.getEstadsJugador(nombre).subscribe({
      next: datos => {
        this.stats.set(datos);
        this.cargando.set(false);
      },
      error: err => {
        console.error('Error cargando stats:', err);
        this.error.set(true);
        this.cargando.set(false);
      }

    });

    this.sheetsService.getClasificacion().subscribe({
    next: datos => {
      const ordenados = [...datos].sort((a, b) => b.puntos - a.puntos);
        const conPosicion = ordenados.map((j, i) => ({ ...j, posicion: i + 1 }));
        this.clasificacion.set(conPosicion);
      
    },
    error: err => {
      console.error('Error cargando clasificación:', err);
      this.error.set(true);
    }
  });
  }


protected posicionJugador = computed(() => {
  const nombre = this.nombreJugador().toLowerCase();

  console.log('Nombre:', this.nombreJugador());
  console.log('Clasificación:', this.clasificacion());

  const jugador = this.clasificacion().find(
    j => j.nombre.toLowerCase() === nombre
  );

  return jugador?.posicion;
});

  protected getMejorJornada(): JornadaJugador | undefined {
    const jornadasCompletadas = this.stats()?.jornadas.filter(j => j.resultado && j.resultado.trim() !== '') || [];
    return jornadasCompletadas.reduce((max, j) => (j.puntos > max.puntos ? j : max));
  }

  protected getPeorJornada(): JornadaJugador | undefined {
    const jornadasCompletadas = this.stats()?.jornadas.filter(j => j.resultado && j.resultado.trim() !== '') || [];
    return jornadasCompletadas.reduce((min, j) => (j.puntos < min.puntos ? j : min));
  }

  protected getJornadasConResultado(): number {
    if (!this.stats()) return 1;
    return this.stats()!.jornadas.filter(j => j.resultado && j.resultado.trim() !== '').length;
  }

  protected getAciertos(): number {
    if (!this.stats()) return 0;
    return this.stats()!.jornadas.filter(j => {
      const tieneResultado = j.resultado && j.resultado.trim() !== '';
      return tieneResultado && j.pronostico === j.resultado;
    }).length;
  }

  protected getAciertosFormato(): string {
    const aciertos = this.getAciertos();
    const jornadasConResultado = this.getJornadasConResultado();
    return `${aciertos}/${jornadasConResultado}`;
  }

  protected getTasaAcierto(): number {
    const jornadasConResultado = this.getJornadasConResultado();
    return Math.round((this.getAciertos() / jornadasConResultado) * 100);
  }
}
