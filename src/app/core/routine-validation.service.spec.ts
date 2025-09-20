import { TestBed } from '@angular/core/testing';

import { RoutineValidationService } from './routine-validation.service';

describe('RoutineValidationService', () => {
  let service: RoutineValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutineValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
