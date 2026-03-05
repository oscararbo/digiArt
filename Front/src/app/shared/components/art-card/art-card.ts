import { Component, Input, OnInit, inject, effect, ChangeDetectorRef, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { LoginPopupService } from '../../services/login-popup.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { NgClass, NgIf } from "@angular/common";

@Component({
  selector: 'app-art-card',
  templateUrl: './art-card.html',
  styleUrls: ['./art-card.scss'],
  standalone: true,
  imports: [NgClass],
})
export class ArtCard implements OnInit {
  @Input() data: {
    id?: string | number;
    title?: string;
    author?: string;
    imageUrl?: string;
    liked?: boolean;
    likeCount?: number;
  } | any = {};

  @Input() userId?: string | number | null = null;

  liked: boolean = false;
  loadingFav: boolean = false;
  currentUserId: string | number | null = null;
  // per-artwork signal provided by UserService
  private artworkSignal: WritableSignal<any> | null = null;
  private idSignal = signal<string | number | null>(null);
  
  private router = inject(Router);
  private userService = inject(UserService);
  private loginPopup = inject(LoginPopupService);
  private http = inject(HttpClient);
  private cd = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);
  private authGuard = inject(AuthGuard);

  // Effect must be created in an injection context (field initializer or constructor)
  private _sync = effect(() => {
    const id = this.idSignal();
    if (!id) return;
    // obtain or create the per-artwork signal
    try {
      this.artworkSignal = this.userService.getArtworkSignal(String(id), this.data);
    } catch (e) {
      this.notificationService.showError('Error al cargar los datos de la obra. Por favor recarga la página.');
      return;
    }

    const art = this.artworkSignal();
    // prefer server-provided fields from the shared artwork signal
    if (art) {
      this.data = { ...this.data, ...art };
    }

    // derive liked from the artwork signal or from UserService.liked list
    this.liked = !!(art?.liked) || !!(this.userService.userLikedArtworks().find((a: any) => String(a.id) === String(id)));
  });

  ngOnInit() {
    // initial: if API provided `liked` use it, otherwise infer from UserService.signal when available
    this.liked = !!this.data?.liked;
    // set idSignal so the effect will wire the per-artwork signal
    this.idSignal.set(this.data?.id ?? null);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserId = user?.id;
      } catch (e) {
        this.notificationService.showError('Error al procesar tus datos. Por favor intenta de nuevo.');
      }
    }
  }

// #region NAVIGATION

  /**
   * Navigate to the detail page of the artwork when the card is clicked.
   */
  goToDetail() {
    const id = this.data?.id;
    if (!id) return;
    this.router.navigate(['/art', id]);
  }

// #endregion
// #region LIKE FUNCTIONALITY

  /** Handle the like/unlike action for the artwork.
   */
  async toggleFavorite(event: Event) {
    event.stopPropagation();

    if (!this.authGuard.checkAuthentication()) {
      return;
    }

    const userId = this.userId || this.currentUserId;
    if (!userId) {
      try { this.loginPopup.open(); } catch (e) { }
      return;
    }

    this.loadingFav = true;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        try { this.loginPopup.open(); } catch (e) { }
        this.loadingFav = false;
        return;
      }

      const currentlyLiked = !!this.userService.userLikedArtworks().find((a: any) => String(a.id) === String(this.data.id));
      const action = currentlyLiked ? 'remove' : 'add';

      let res: any;
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        res = await firstValueFrom(this.http.post<any>(
          `http://127.0.0.1:8000/api/artworks/${this.data.id}/like/`,
          { action },
          { headers }
        ));
      } catch (httpErr: any) {
        if (httpErr?.status === 401) {
          try { this.loginPopup.open(); } catch (e) {}
          this.loadingFav = false;
          return;
        }
        this.notificationService.showError('Error al actualizar favorito. Por favor intenta de nuevo.');
        throw httpErr;
      }

      const nowLiked = res.action === 'add' || res.action === 'liked' || (res.success && (res.action === undefined) ? (res.likes > 0) : false);
      const updated = { ...(this.data as any), likeCount: res.likes ?? this.data.likeCount, liked: !!nowLiked };

      try {
        this.userService.updateArtworkGlobally(updated);
      } catch (e) {
        this.notificationService.showError('Error al actualizar la obra. Por favor intenta de nuevo.');
      }

      try {
        if (updated.liked) {
          this.userService.userLikedArtworks.update(list => {
            if (list.find(a => String(a.id) === String(updated.id))) return list;
            return [{ ...(updated as any) }, ...list];
          });
        } else {
          this.userService.userLikedArtworks.update(list => list.filter(a => String(a.id) !== String(updated.id)));
        }
      } catch (e) {
        this.notificationService.showError('Error al actualizar favoritos. Por favor intenta de nuevo.');
      }

      this.data = updated;
      this.liked = !!updated.liked;
      try { this.cd.detectChanges(); } catch (e) {}
    } catch (err) {
      this.notificationService.showError('Error al actualizar favorito. Por favor intenta de nuevo.');
    } finally {
      this.loadingFav = false;
    }
  }
// #endregion
}
