import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadArtForm } from './upload-art-form';

describe('UploadArtForm', () => {
  let component: UploadArtForm;
  let fixture: ComponentFixture<UploadArtForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadArtForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadArtForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
