import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginPopUp } from './shared/components/login-pop-up/login-pop-up';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginPopUp],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('DigiArt');
}
