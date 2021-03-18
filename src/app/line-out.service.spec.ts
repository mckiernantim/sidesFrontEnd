import { TestBed } from '@angular/core/testing';

import { LineOutService } from './line-out.service';

describe('LineOutService', () => {
  let service: LineOutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LineOutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
