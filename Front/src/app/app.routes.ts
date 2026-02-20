import {Routes} from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./layouts/auth-layout/auth-layout").then(c => c.AuthLayout),
  },
  {
    path: "home",
    loadComponent: () => import("./features/home/home").then(c => c.Home),
  },
  {
    path: "profile",
    loadComponent: () => import("./features/profile/profile").then(c => c.Profile),
    canActivate: [authGuard]
  }
];
