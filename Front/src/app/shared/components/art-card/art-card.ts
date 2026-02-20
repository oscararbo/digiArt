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
    // Get current user ID from localStorage
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

  /**
   * Navigate to the detail page of the artwork when the card is clicked.
   * This function is called when the user clicks on the art card, allowing them to view more details about the artwork on a separate page.
   * @returns 
   */
  goToDetail() {
    const id = this.data?.id;
    if (!id) return;
    // navigate to art-detail with id
    this.router.navigate(['/art-detail', id]);
  }

  /** Handle the like/unlike action for the artwork.
   * This function is called when the user clicks on the like button on the art card, allowing them to like or unlike the artwork and updating the like status accordingly.
   * @param event 
   * @returns 
   */
  //TODO: Hecho por chati, cambiar en algun momento
  async toggleFavorite(event: Event) {
    event.stopPropagation();
    
    // Check authentication before proceeding
    if (!this.authGuard.checkAuthentication()) {
      return;
    }

    // Use current user ID from localStorage if userId not provided
    const userId = this.userId || this.currentUserId;
    
    if (!userId) {
      // Open shared login popup instead of alert
      try { this.loginPopup.open(); } catch (e) { }
      return;
    }

    // Do not change `liked` optimistically to avoid change-detection errors.
    // Show loading state while request completes.
    this.loadingFav = true;

    try {
      // Ensure we have a token; if not, open login popup
      const token = localStorage.getItem('access_token');
      if (!token) {
        try { this.loginPopup.open(); } catch (e) { }
        this.loadingFav = false;
        return;
      }

      // Determine current liked state from shared signal/list to avoid stale local `this.liked`
      const currentlyLiked = !!this.userService.userLikedArtworks().find((a: any) => String(a.id) === String(this.data.id));
      const action = currentlyLiked ? 'remove' : 'add';

      // Use HttpClient with explicit Authorization header
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
      // Compute new liked state from server response
      const nowLiked = res.action === 'add' || res.action === 'liked' || (res.success && (res.action === undefined) ? (res.likes > 0) : false);
      const updated = { ...(this.data as any), likeCount: res.likes ?? this.data.likeCount, liked: !!nowLiked };

      // First, update the per-artwork/global signals so all card instances reflect the new artwork state immediately
      try {
        this.userService.updateArtworkGlobally(updated);
      } catch (e) {
        this.notificationService.showError('Error al actualizar la obra. Por favor intenta de nuevo.');
      }

      // Then update the user's liked list (add or remove)
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

      // Update local fields and stabilize view
      this.data = updated;
      this.liked = !!updated.liked;
      // stabilize view after applying server-driven changes
      try { this.cd.detectChanges(); } catch (e) {}
    } catch (err) {
      this.notificationService.showError('Error al actualizar favorito. Por favor intenta de nuevo.');
    } finally {
      this.loadingFav = false;
    }
  }
}