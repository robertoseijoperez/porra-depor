import { Component, OnInit, signal, inject, ViewChild, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SheetsService, Clasificacion } from '../sheets';
import { SheetContextService } from '../sheet-context.service';

interface Temporada {
  year: string;
  spreadsheetId: string;
}

@Component({
  selector: 'app-clasificacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './clasificacion.html',
  styleUrl: './clasificacion.css'
})
export class ClasificacionComponent implements OnInit, AfterViewInit {
  @ViewChild('temporadasContenedor') temporadasContenedor!: ElementRef;

  private sheetsService = inject(SheetsService);
  private renderer = inject(Renderer2);
  protected sheetContext = inject(SheetContextService);    
  protected clasificacion = signal<Clasificacion[]>([]);
  protected cargando = signal(true);
  protected error = signal(false);
  protected temporadas = this.sheetContext.temporadas;
  protected temporadaActual = this.sheetContext.temporadaActual;

  protected emojis: Record<number, string> = {
    1: '🏆',
    2: '🥈',
    3: '🥉',
    4: '💩'
  };

  private touchStartX = 0;
  private touchEndX = 0;

  ngOnInit() {
    this.cargarClasificacion();
    this.inicializarSwipe();
  }

  ngAfterViewInit() {
    this.scrollATemporadaActual();
  }

  cargarClasificacion() {
    this.cargando.set(true);
    this.error.set(false);
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

  cambiarTemporada(indice: number) {
    this.sheetContext.cambiarTemporada(indice); 
    this.cargarClasificacion(); 
    this.scrollATemporadaActual();
  }

  temporadaActualIndex(): number {
    return this.sheetContext.getTemporadaActualIndex();
  }

  irATemporadaAnterior() {
    if (this.sheetContext.getTemporadaActualIndex() > 0) {
      this.cambiarTemporada(this.sheetContext.getTemporadaActualIndex() - 1);
    }
  }

  irATemporadaSiguiente() {
    if (this.sheetContext.getTemporadaActualIndex() < this.sheetContext.temporadas.length - 1) {
      this.cambiarTemporada(this.sheetContext.getTemporadaActualIndex() + 1);
    }
  }

  private inicializarSwipe() {
    const elemento = this.temporadasContenedor?.nativeElement;
    if (elemento) {
      this.renderer.listen(elemento, 'touchstart', (e) => this.handleTouchStart(e));
      this.renderer.listen(elemento, 'touchend', (e) => this.handleTouchEnd(e));
    }
  }

  private handleTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  private handleTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.detectarSwipe();
  }

  private detectarSwipe() {
    const diferencia = this.touchStartX - this.touchEndX;
    const minimoSwipe = 50;

    if (Math.abs(diferencia) > minimoSwipe) {
      if (diferencia > 0) {
        // Swipe izquierda → siguiente temporada
        this.irATemporadaSiguiente();
      } else {
        // Swipe derecha → temporada anterior
        this.irATemporadaAnterior();
      }
    }
  }

  private scrollATemporadaActual() {
    setTimeout(() => {
      const contenedor = this.temporadasContenedor?.nativeElement;
      const cardActiva = contenedor?.querySelector('.temporada-card.activa');
      
      if (contenedor && cardActiva) {
        const scrollLeft = cardActiva.offsetLeft - (contenedor.clientWidth / 2) + (cardActiva.clientWidth / 2);
        contenedor.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }, 100);
  }
}