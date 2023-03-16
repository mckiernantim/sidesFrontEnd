

import { LineOutService } from './line-out.service';
import { TestBed } from '@angular/core/testing';
describe('LineOutService', () => {
  let service: LineOutService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [LineOutService]});
    service = TestBed.inject(LineOutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
