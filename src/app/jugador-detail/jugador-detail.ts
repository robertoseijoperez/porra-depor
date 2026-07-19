import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SheetsService, EstadsJugador, JornadaJugador, Clasificacion } from '../sheets';

@Component({
  selector: 'app-jugador-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './jugador-detail.html',
  styleUrl: './jugador-detail.css'
})
export class JugadorDetailComponent implements OnInit {
  private sheetsService = inject(SheetsService);
  private route = inject(ActivatedRoute);


  protected stats = signal<EstadsJugador | null>(null);
  protected cargando = signal(true);
  protected error = signal(false);
  protected nombreJugador = signal('');
  protected fotoPerfil = signal('');
  protected clasificacion = signal<Clasificacion[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const nombre = params.get('nombre');
      if (nombre) {
        this.fotoPerfil.set(this.construirRutaFoto(nombre));        
        this.nombreJugador.set(nombre);
        this.cargarStats(nombre);

      }
    });
  }

  private construirRutaFoto(nombre: string): string {
    return `assets/players/${nombre.toLowerCase()}.jpg`;
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
    return this.stats()?.jornadas.reduce((max, j) => (j.puntos > max.puntos ? j : max));
  }

  protected getPeorJornada(): JornadaJugador | undefined {
    return this.stats()?.jornadas.reduce((min, j) => (j.puntos < min.puntos ? j : min));
  }

  protected getAciertos(): number {
    if (!this.stats()) return 0;
    return this.stats()!.jornadas.filter(j => j.pronostico === j.resultado).length;
  }

  protected getTasaAcierto(): number {
    const jornadas = this.stats()?.jornadas.length || 1;
    return Math.round((this.getAciertos() / jornadas) * 100);
  }
}
