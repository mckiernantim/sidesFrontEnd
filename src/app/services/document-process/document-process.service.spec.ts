import { TestBed } from '@angular/core/testing';

import { DocumentProcessService } from './document-process.service';

describe('DocumentProcessService', () => {
  let service: DocumentProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
