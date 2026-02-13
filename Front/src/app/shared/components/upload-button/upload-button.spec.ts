import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadButton } from './upload-button';

describe('UploadButton', () => {
  let component: UploadButton;
  let fixture: ComponentFixture<UploadButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
