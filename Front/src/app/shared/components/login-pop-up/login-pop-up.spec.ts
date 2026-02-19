import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPopUp } from './login-pop-up';

describe('LoginPopUp', () => {
  let component: LoginPopUp;
  let fixture: ComponentFixture<LoginPopUp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPopUp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPopUp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
