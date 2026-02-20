import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-error-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-notification.html',
  styleUrl: './error-notification.scss',
})
export class ErrorNotification {
  notificationService = inject(NotificationService);

  // Filter to show only errors from notifications
  get errors() {
    return this.notificationService.notifications().filter(n => n.type === 'error');
  }
}
