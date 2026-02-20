import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);
  private notificationTimeout: Map<string, ReturnType<typeof setTimeout>> = new Map();

  showNotification(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error', duration: number = 5000) {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      type,
      message,
      timestamp: Date.now()
    };

    this.notifications.update(list => [...list, notification]);

    // Auto-remove notification after duration
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.removeNotification(id);
      }, duration);
      this.notificationTimeout.set(id, timeout);
    }
  }

  removeNotification(id: string) {
    this.notifications.update(list => list.filter(n => n.id !== id));
    
    const timeout = this.notificationTimeout.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.notificationTimeout.delete(id);
    }
  }

  showError(message: string) {
    this.showNotification(message, 'error', 5000);
  }

  showSuccess(message: string) {
    this.showNotification(message, 'success', 3000);
  }

  showWarning(message: string) {
    this.showNotification(message, 'warning', 4000);
  }

  showInfo(message: string) {
    this.showNotification(message, 'info', 4000);
  }
}
