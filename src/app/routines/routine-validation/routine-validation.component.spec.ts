import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutineValidationComponent } from './routine-validation.component';

describe('RoutineValidationComponent', () => {
  let component: RoutineValidationComponent;
  let fixture: ComponentFixture<RoutineValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineValidationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutineValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
