import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtworkStatsDisplayComponent } from './artwork-stats-display';

describe('ArtworkStatsDisplayComponent', () => {
  let component: ArtworkStatsDisplayComponent;
  let fixture: ComponentFixture<ArtworkStatsDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ArtworkStatsDisplayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtworkStatsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
