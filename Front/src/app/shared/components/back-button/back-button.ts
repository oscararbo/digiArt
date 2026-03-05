import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss'
})
export class BackButtonComponent {
  constructor(private location: Location) {}

  /**
   * Navigate to previous browser history entry
   */
  goBack() {
    this.location.back();
  }
}
