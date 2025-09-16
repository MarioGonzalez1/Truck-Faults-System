import { Routes } from '@angular/router';
import { TruckDetailsComponent } from './components/truck-details/truck-details';
import { HomeComponent } from './components/home/home';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard';

export const routes: Routes = [
  {
    path: '',
    component: ProjectDashboardComponent
  },
  {
    path: 'project/:id',
    component: HomeComponent
  },
  {
    path: 'project/:id/truck/:vin',
    component: TruckDetailsComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
