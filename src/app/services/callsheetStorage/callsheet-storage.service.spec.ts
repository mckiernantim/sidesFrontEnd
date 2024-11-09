import { TestBed } from '@angular/core/testing';

import { CallsheetStorageService } from './callsheet-storage.service';

describe('CallsheetStorageService', () => {
  let service: CallsheetStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallsheetStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
