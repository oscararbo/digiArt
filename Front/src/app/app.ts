import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPopUp } from './shared/components/login-pop-up/login-pop-up';
import { ErrorNotification } from './shared/components/error-notification/error-notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginPopUp, ErrorNotification],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('DigiArt');
}
