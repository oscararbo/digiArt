import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-artwork-stats-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artwork-stats-display.html',
  styleUrl: './artwork-stats-display.scss'
})
export class ArtworkStatsDisplayComponent {
  @Input() viewCount: number = 0;
  @Input() likeCount: number = 0;
}
