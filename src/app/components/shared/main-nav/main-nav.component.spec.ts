import { LayoutModule } from '@angular/cdk/layout';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';


import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TokenService } from 'src/app/services/token/token.service';
import { MainNavComponent } from './main-nav.component';

describe('MainNavComponent', () => {
  let component: MainNavComponent;
  let fixture: ComponentFixture<MainNavComponent>;
  let mockTokenService: any;
  let mockRouter: any;

  beforeEach(waitForAsync(() => {
    // Create mock token service
    mockTokenService = {
      getCountdown: jasmine.createSpy('getCountdown').and.returnValue(of(100))
    };

    // Create mock router
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      declarations: [MainNavComponent],
      imports: [
     
      ],
      providers: [
        { provide: TokenService, useValue: mockTokenService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to token countdown on init', () => {
    expect(mockTokenService.getCountdown).toHaveBeenCalled();
  });

  it('should navigate to upload page when token expires', () => {
    // Simulate token expiration
    mockTokenService.getCountdown.and.returnValue(of(-1));
    component.ngAfterViewInit();
    fixture.detectChanges();
  
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/upload']);
  });
  
  
});



