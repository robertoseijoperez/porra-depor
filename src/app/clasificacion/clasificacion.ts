import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SheetsService, Clasificacion } from '../sheets';

@Component({
  selector: 'app-clasificacion',
  imports: [RouterLink],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.css'
})
export class ClasificacionComponent implements OnInit {
  private sheetsService = inject(SheetsService);

  protected clasificacion = signal<Clasificacion[]>([]);
  protected cargando = signal(true);
  protected error = signal(false);

  protected emojis: Record<number, string> = {
    1: '🏆',
    2: '🥈',
    3: '🥉',
    4: '💩'
  };

  ngOnInit() {
    this.sheetsService.getClasificacion().subscribe({
      next: datos => {
        const ordenados = [...datos].sort((a, b) => b.puntos - a.puntos);
        const conPosicion = ordenados.map((j, i) => ({ ...j, posicion: i + 1 }));
        this.clasificacion.set(conPosicion);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}