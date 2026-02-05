import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./layouts/auth-layout/auth-layout").then(c => c.AuthLayout),
  }
];
