import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SheetsService, Jornada } from '../sheets';

@Component({
  selector: 'app-jornada-list',
  imports: [RouterLink],
  templateUrl: './jornada-list.html',
  styleUrl: './jornada-list.css'
})
export class JornadaList implements OnInit {
  private sheetsService = inject(SheetsService);

  protected jornadas = signal<Jornada[]>([]);
  protected cargando = signal(true);
  protected error = signal(false);

  ngOnInit() {
    this.sheetsService.getJornadas().subscribe({
      next: datos => {
        this.jornadas.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}