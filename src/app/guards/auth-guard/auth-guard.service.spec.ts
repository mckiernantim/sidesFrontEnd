import { AuthGuardService } from './auth-guard.service';

describe('AuthGuardService', () => {
  let service: AuthGuardService;

  beforeEach(() => {
    service = new AuthGuardService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});