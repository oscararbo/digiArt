import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./layouts/auth-layout/auth-layout").then(c => c.AuthLayout),
  },
  {
    path: "card",
    loadComponent: () => import("./shared/components/art-card/art-card").then(c => c.ArtCard),
  },
  {
    path: "upload",
    loadComponent: () => import("./shared/components/upload-art-form/upload-art-form").then(c => c.UploadArtForm),
  },
  {
    path: "home",
    loadComponent: () => import("./features/home/home").then(c => c.Home),
  }
];
