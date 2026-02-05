import {Component} from '@angular/core';
import {Login} from '../../features/auth/login/login';
import {Register} from '../../features/auth/register/register';
import {NgClass} from '@angular/common';

type typePage = "login" | "register";

@Component({
  selector: 'app-auth-layout',
  imports: [
    Login,
    Register,
    NgClass
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {

  typePageForm: typePage = "login";


  togglePageForm(type: typePage) {
    this.typePageForm = type;
  }

}
