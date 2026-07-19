import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SheetsService, Jornada } from '../sheets';

interface PronosticoState {
  jugador: string;
  pronostico: string;
  confirmado: boolean;
}

@Component({
  selector: 'app-pronostico-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './pronostico-registro.html',
  styleUrl: './pronostico-registro.css'
})
export class PronosticoRegistroComponent implements OnInit {
  private sheetsService = inject(SheetsService);
  private router = inject(Router);

  protected cargando = signal(true);
  protected error = signal('');
  protected jornada = signal<Jornada | null>(null);
  protected pronosticos = signal<Map<string, PronosticoState>>(new Map());
  protected inputPronostico = signal('');
  protected enviando = signal(false);

  // Jugadores en orden
  private jugadores = ['juan', 'maria', 'rober', 'juanocho'];

  // Computed: jugadores que ya pronosticaron
  protected jugadoresCompletados = computed(() => {
    const completados: string[] = [];
    this.pronosticos().forEach((state, jugador) => {
      if (state.confirmado) {
        completados.push(jugador.charAt(0).toUpperCase() + jugador.slice(1));
      }
    });
    return completados;
  });

  // Computed: jugador actual (siguiente en turno que no ha pronosticado)
  protected jugadorActual = computed(() => {
    const jornada = this.jornada();
    if (!jornada) return '';

    const turnos = jornada.turnos.split('-').map(t => t.trim().toLowerCase());
    return turnos.find(jugador => {
      const state = this.pronosticos().get(jugador);
      return !state || !state.confirmado;
    });
  });

  // Computed: siguientes jugadores
  protected siguientesJugadores = computed(() => {
    const jornada = this.jornada();
    const actual = this.jugadorActual();
    if (!jornada || !actual) return [];

    const turnos = jornada.turnos.split('-').map(t => t.trim().toLowerCase());
    const indexActual = turnos.indexOf(actual);
    return turnos.slice(indexActual + 1).map(j => j.charAt(0).toUpperCase() + j.slice(1));
  });

  // Computed: ¿Está completado?
  protected todoCompleto = computed(() => {
    const jornada = this.jornada();
    if (!jornada) return false;

    const turnos = jornada.turnos.split('-').map(t => t.trim().toLowerCase());
    return turnos.every(jugador => {
      const state = this.pronosticos().get(jugador);
      return state && state.confirmado;
    });
  });

  ngOnInit() {
    this.cargarJornada();
  }

  private cargarJornada() {
    this.sheetsService.getJornadas().subscribe({
      next: (jornadas: Jornada[]) => {
        // Encontrar la primera jornada sin pronósticos completos
        const jornadaSinPronosticos = jornadas.find(j => {
          return !j.pronosticos.juan || !j.pronosticos.maria || 
                 !j.pronosticos.rober || !j.pronosticos.juanocho;
        });

        if (!jornadaSinPronosticos) {
          this.error.set('Todas las jornadas tienen pronósticos registrados');
          this.cargando.set(false);
          return;
        }

        this.jornada.set(jornadaSinPronosticos);

        // Inicializar estado de pronósticos
        const pronosticosMap = new Map<string, PronosticoState>();
        this.jugadores.forEach(jugador => {
          const value = jornadaSinPronosticos.pronosticos[jugador as keyof typeof jornadaSinPronosticos.pronosticos];
          pronosticosMap.set(jugador, {
            jugador,
            pronostico: value || '',
            confirmado: !!value
          });
        });
        this.pronosticos.set(pronosticosMap);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las jornadas');
        this.cargando.set(false);
      }
    });
  }

  confirmarPronostico() {
    const actual = this.jugadorActual();
    const input = this.inputPronostico().trim();

    if (!actual || !input) {
      this.error.set('Por favor ingresa un pronóstico');
      return;
    }

    // Validar formato (X-Y)
    if (!/^\d-\d$/.test(input)) {
      this.error.set('Formato inválido. Usa el formato X-Y (ej: 2-1)');
      return;
    }

    const jornada = this.jornada();
    if (!jornada) return;

    this.enviando.set(true);
    this.error.set('');

    this.sheetsService.guardarPronostico(jornada.numero, actual, input).subscribe({
      next: () => {
        // Actualizar estado local
        const pronosticosMap = new Map(this.pronosticos());
        pronosticosMap.set(actual, {
          jugador: actual,
          pronostico: input,
          confirmado: true
        });
        this.pronosticos.set(pronosticosMap);
        this.inputPronostico.set('');
        this.enviando.set(false);
      },
      error: (err) => {
        this.error.set('Error al guardar el pronóstico. Inténtalo de nuevo.');
        this.enviando.set(false);
        console.error(err);
      }
    });
  }

  volver() {
    this.router.navigate(['']);
  }
}
