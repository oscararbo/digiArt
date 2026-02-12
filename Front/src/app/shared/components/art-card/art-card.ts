import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-art-card',
  templateUrl: './art-card.html',
  styleUrls: ['./art-card.scss'],
  standalone: true,
})
export class ArtCard {
  @Input() data: {
    id?: string | number;
    title?: string;
    author?: string;
    imageUrl?: string;
    liked?: boolean;
  } | any = {};

  @Input() userId?: string | number | null = null;

  liked: boolean = false;
  loadingFav: boolean = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.liked = !!this.data?.liked;
  }

  goToDetail() {
    const id = this.data?.id;
    if (!id) return;
    // navigate to art-detail with id
    this.router.navigate(['/art-detail', id]);
  }

  async toggleFavorite(event: Event) {
    event.stopPropagation();
    if (!this.userId) {
      alert('Necesitas iniciar sesión para favoritos');
      return;
    }

    // optimistic UI
    this.liked = !this.liked;
    this.loadingFav = true;

    try {
      const action = this.liked ? 'add' : 'remove';
      const response = await fetch('https://api.example.com/art/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId: this.data.id, userId: this.userId, action }),
      });

      if (!response.ok) {
        throw new Error('Error favorito');
      }

      const res = await response.json();
      // optionally use res to update UI
      console.log('Favorite response', res);
    } catch (err) {
      console.error(err);
      // revert optimistic change on error
      this.liked = !this.liked;
      alert('Error al actualizar favorito');
    } finally {
      this.loadingFav = false;
    }
  }
}