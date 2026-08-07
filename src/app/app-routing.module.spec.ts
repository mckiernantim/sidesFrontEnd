import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './guards/auth.guard';

/**
 * Spec 028 US1 (T024) — /start and /my-projects must be behind AuthGuard,
 * exactly like the existing /schedule routes. Router.config exposes the
 * compiled Routes array without needing to render any routed component.
 */
describe('AppRoutingModule routes', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppRoutingModule],
    });
    router = TestBed.inject(Router);
  });

  it('/start is behind AuthGuard', () => {
    const route = router.config.find((r) => r.path === 'start');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(AuthGuard);
  });

  it('/my-projects is behind AuthGuard', () => {
    const route = router.config.find((r) => r.path === 'my-projects');
    expect(route).toBeDefined();
    expect(route?.canActivate).toContain(AuthGuard);
  });
});
