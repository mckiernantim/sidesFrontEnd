

import { UploadService } from './upload.service';
import { TestBed } from '@angular/core/testing';
describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [UploadService]});
    service = TestBed.inject(UploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
