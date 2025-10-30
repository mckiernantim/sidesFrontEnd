import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainNavComponent } from './main-nav.component';
import { Observable, of, Subscription } from 'rxjs';
import { TokenService } from '../../../services/token/token.service';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockBreakpointObserver {
  observe() {
    return of({ matches: true });
  }
}

class MockTokenService {
  countdown$ = of(5000);
  initializeCountdown = jest.fn();
}

describe('MainNavComponent', () => {
  let component: MainNavComponent;
  let fixture: ComponentFixture<MainNavComponent>;
  let tokenService: MockTokenService;
  let route: ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainNavComponent],
      providers: [
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: TokenService, useClass: MockTokenService },
      ],
      imports: [RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainNavComponent);
    component = fixture.componentInstance;
    tokenService = TestBed.inject(TokenService) as unknown as MockTokenService;
    route = TestBed.inject(ActivatedRoute);

    // Mock queryParams observable
    jest.spyOn(route.queryParams, 'subscribe').mockImplementation((callback: any) => {
      callback({ expires: '5000' });
      return new Subscription();
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize countdown and display clock', () => {
    expect(component.countdown).toBe(5000);
    expect(tokenService.initializeCountdown).toHaveBeenCalledWith(5000);
  });

  it('should update countdownClock correctly', () => {
    component.ngOnInit();
    expect(component.countdownClock).toBe('00:00:05');
  });

  it('should hide the clock when countdown reaches zero', () => {
    // Mock the countdown$ observable to emit zero
    tokenService.countdown$ = of(0);
    component.ngOnInit();
    expect(component.displayClock).toBe(false);
  });

  it('should format time correctly', () => {
    const formattedTime = component.formatTime(3661000); // 1 hour, 1 minute, 1 second
    expect(formattedTime).toBe('01:01:01');
  });
});
