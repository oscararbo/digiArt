import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CollapsibleSidebar } from './collapsible-section';

describe('CollapsibleSidebar', () => {
  let component: CollapsibleSidebar;
  let fixture: ComponentFixture<CollapsibleSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapsibleSidebar]
    }).compileComponents();

    fixture = TestBed.createComponent(CollapsibleSidebar);
    component = fixture.componentInstance;
    component.expandedSignal = signal(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
