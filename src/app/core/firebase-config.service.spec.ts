import { TestBed } from '@angular/core/testing';

import { FirebaseConfigService } from './firebase-config.service';

describe('FirebaseConfigService', () => {
  let service: FirebaseConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebaseConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
