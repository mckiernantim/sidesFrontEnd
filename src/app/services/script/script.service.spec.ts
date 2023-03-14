

import { ScriptService } from './script.service';
import { TestBed } from '@angular/core/testing';
describe('ScriptService', () => {
  let service: ScriptService;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [ScriptService]});
    service = TestBed.inject(ScriptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
