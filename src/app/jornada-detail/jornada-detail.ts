import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SheetsService, Jornada } from '../sheets';

@Component({
  selector: 'app-jornada-detail',
  imports: [RouterLink],
  templateUrl: './jornada-detail.html',
  styleUrl: './jornada-detail.css'
})
export class JornadaDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private sheetsService = inject(SheetsService);

  protected jornada = signal<Jornada | null>(null);
  protected cargando = signal(true);
  protected error = signal(false);

  protected participantes = computed(() => {
    const j = this.jornada();
    if (!j) return [];

    const lista = [
      { nombre: 'Juan', pronostico: j.pronosticos.juan, puntos: j.puntos.juan },
      { nombre: 'María', pronostico: j.pronosticos.maria, puntos: j.puntos.maria },
      { nombre: 'Rober', pronostico: j.pronosticos.rober, puntos: j.puntos.rober },
      { nombre: 'Juanocho', pronostico: j.pronosticos.juanocho, puntos: j.puntos.juanocho },
    ];

    return [...lista].sort((a, b) => b.puntos - a.puntos);
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.sheetsService.getJornadas().subscribe({
      next: jornadas => {
        const encontrada = jornadas.find(j => j.numero === id);
        this.jornada.set(encontrada ?? null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}