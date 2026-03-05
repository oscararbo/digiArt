import { Component, OnInit, OnDestroy, signal, computed, inject, effect, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ArtworkService, ArtworkDetail, Comment } from '../../core/services/artwork.service';
import { NotificationService } from '../../core/services/notification.service';
import { BackButtonComponent } from '../../shared/components/back-button/back-button';
import { CollapsibleSidebar } from '../../shared/components/collapsible-section/collapsible-section';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-art-detail',
  templateUrl: './art-detail.html',
  styleUrl: './art-detail.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent, CollapsibleSidebar],
  encapsulation: ViewEncapsulation.None
})
export class ArtDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private artworkService = inject(ArtworkService);
  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  artworkId = signal<string>('');
  artwork = signal<ArtworkDetail | null>(null);
  isLoading = signal<boolean>(false);
  isLiking = signal<boolean>(false);
  isAddingComment = signal<boolean>(false);
  
  // Section collapse state
  infoExpanded = signal<boolean>(true);
  commentsExpanded = signal<boolean>(true);

  // Comment input
  commentText = signal<string>('');
  currentUser = signal<any>(null);

  // Computed values for dynamic sizing
  mainImageWidth = computed(() => {
    const total = 100;
    const infoWidth = this.infoExpanded() ? 30 : 0;
    const commentsWidth = this.commentsExpanded() ? 25 : 0;
    return total - infoWidth - commentsWidth;
  });

  ngOnInit() {
    // Load current user
    this.loadCurrentUser();

    // Get artwork ID from route params and load artwork
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['id'];
        if (id) {
          this.artworkId.set(id);
          this.loadArtwork(id);
          this.artworkService.incrementViewCount(id).catch(err =>
            console.error('Error incrementing view count:', err)
          );
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

// #region DATA LOADING

  /**
   * Load current user from localStorage
   */
  loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }

  /**
   * Load artwork details
   */
  async loadArtwork(id: string) {
    this.isLoading.set(true);
    try {
      const data = await this.artworkService.getArtworkDetail(id);
      this.artwork.set(data);
    } catch (error) {
      console.error('Error loading artwork:', error);
      this.notificationService.showError('Error al cargar la obra. Por favor intenta de nuevo.');
      setTimeout(() => this.router.navigate(['/home']), 2000);
    } finally {
      this.isLoading.set(false);
    }
  }

// #endregion
// #region LIKES AND INTERACTIONS

  /**
   * Toggle like on artwork
   */
  async toggleLike() {
    if (!this.artwork()) return;
    if (this.isLiking()) return;


    this.isLiking.set(true);
    try {
      const result = await this.artworkService.toggleLike(this.artworkId());

      this.artwork.update(art => {
        if (!art) return art;
        const updated = {
          ...art,
          isLiked: result.isLiked,
          likeCount: result.likeCount
        };
        return updated;
      });

      this.notificationService.showSuccess(
        result.isLiked ? 'Obra aÃ±adida a favoritos' : 'Obra removida de favoritos'
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      this.notificationService.showError('Error al actualizar el like. Por favor intenta de nuevo.');
    } finally {
      this.isLiking.set(false);
    }
  }

// #endregion
// #region COMMENTS

  /**
   * Handle comment input change
   */
  onCommentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.commentText.set(target.value);
  }

  /**
   * Add a new comment
   */
  async addComment() {
    const text = this.commentText().trim();
    if (!text) {
      this.notificationService.showError('El comentario no puede estar vacÃ­o');
      return;
    }

    this.isAddingComment.set(true);
    try {
      const newComment = await this.artworkService.addComment(this.artworkId(), text);

      this.artwork.update(art => {
        if (!art) return art;
        return {
          ...art,
          comments: [newComment, ...art.comments]
        };
      });

      this.commentText.set('');
      this.notificationService.showSuccess('Comentario aÃ±adido correctamente');
    } catch (error) {
      console.error('Error adding comment:', error);
      this.notificationService.showError('Error al aÃ±adir el comentario. Por favor intenta de nuevo.');
    } finally {
      this.isAddingComment.set(false);
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string) {
    if (!confirm('Â¿EstÃ¡s seguro de que deseas eliminar este comentario?')) {
      return;
    }

    try {
      await this.artworkService.deleteComment(this.artworkId(), commentId);

      this.artwork.update(art => {
        if (!art) return art;
        return {
          ...art,
          comments: art.comments.filter(c => c.id !== commentId)
        };
      });

      this.notificationService.showSuccess('Comentario eliminado correctamente');
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.notificationService.showError('Error al eliminar el comentario. Por favor intenta de nuevo.');
    }
  }

// #endregion
// #region UTILITY METHODS

  /**
   * Check if current user is the author of the artwork
   */
  isArtworkAuthor(): boolean {
    const art = this.artwork();
    const user = this.currentUser();
    if (!art || !user) return false;
    return String(art.authorId) === String(user.id);
  }
// #endregion
}
