import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtCard } from './art-card';

describe('ArtCard', () => {
  let component: ArtCard;
  let fixture: ComponentFixture<ArtCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
