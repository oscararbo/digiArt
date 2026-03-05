import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtDetail } from './art-detail';

describe('ArtDetail', () => {
  let component: ArtDetail;
  let fixture: ComponentFixture<ArtDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
