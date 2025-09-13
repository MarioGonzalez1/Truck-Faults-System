import { Routes } from '@angular/router';
import { TruckDetailsComponent } from './components/truck-details/truck-details';
import { HomeComponent } from './components/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'truck/:vin',
    component: TruckDetailsComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
