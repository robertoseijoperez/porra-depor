import { Routes } from '@angular/router';
import { ClasificacionComponent  } from './clasificacion/clasificacion';
import { JornadaList } from './jornada-list/jornada-list';
import { JornadaDetail } from './jornada-detail/jornada-detail';
import { JugadorDetailComponent } from './jugador-detail/jugador-detail';
import { PronosticoRegistroComponent } from './pronostico-registro/pronostico-registro';

export const routes: Routes = [
  { path: '', component: ClasificacionComponent  },
  { path: 'jornadas', component: JornadaList },
  { path: 'jornadas/:id', component: JornadaDetail },
  { path: 'jugador/:nombre', component: JugadorDetailComponent },
  { path: 'pronostico-registro', component: PronosticoRegistroComponent },
];
