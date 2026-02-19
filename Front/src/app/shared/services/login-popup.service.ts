import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoginPopupService {
  private _open = signal<boolean>(false);

  isOpen = this._open;

  open() {
    this._open.set(true);
  }

  close() {
    this._open.set(false);
  }
}
