import { TestBed, fakeAsync, tick, flush, ComponentFixture } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { MainNavComponent } from './main-nav.component';
import { TokenService } from "../../../services/token/token.service";

describe('MainNavComponent', () => {
  let component: MainNavComponent;
  let fixture: ComponentFixture<MainNavComponent>;
  let mockBreakpointObserver: any;
  let mockTokenService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockBreakpointObserver = {
      observe: jest.fn().mockReturnValue(of({ matches: true }))
    };

    mockTokenService = {
      initializeCountdown: jest.fn(),
      countdown$: new BehaviorSubject(5000)  // Use BehaviorSubject to manipulate countdown values
    };

    mockRouter = {
      navigate: jest.fn()
    };

    mockActivatedRoute = {
      queryParams: of({ expires: '5000' })
    };

    await TestBed.configureTestingModule({
      declarations: [ MainNavComponent ],
      providers: [
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Initializes component and runs ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('checks if device is handset', () => {
    expect(mockBreakpointObserver.observe).toHaveBeenCalledWith(Breakpoints.Handset);
    expect(component.isHandset$).toBeTruthy();
  });

  it('should update countdown from queryParams', () => {
    expect(mockTokenService.initializeCountdown).toHaveBeenCalledWith(5000);
  });

  it('should format countdown correctly', () => {
    const formattedTime = component.formatTime(3600000); // 1 hour
    expect(formattedTime).toEqual('01:00:00');
  });

  it('should navigate to error page when countdown is 0', fakeAsync(() => {
    mockTokenService.countdown$.next(0);  // Emit 0 to simulate countdown hitting zero
    tick();  // Process the tick
    fixture.detectChanges();  // Update view with new countdown
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/"]);
    flush();  // Ensure no more microtasks are left
  }));
});
