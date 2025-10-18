import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileLoaderComponent } from './profile-loader.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ProfileLoaderComponent', () => {
  let component: ProfileLoaderComponent;
  let fixture: ComponentFixture<ProfileLoaderComponent>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    // Create mocks
    authServiceMock = {
      user$: of(null) // Default to not authenticated
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    // Create the standalone component
    TestBed.overrideComponent(ProfileLoaderComponent, {
      set: {
        imports: [CommonModule, ],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          { provide: Router, useValue: routerMock }
        ]
      }
    });

    fixture = TestBed.createComponent(ProfileLoaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to profile when user is authenticated', () => {
    // Set user to authenticated
    authServiceMock.user$ = of({ uid: 'test-user-id' });
    
    // Initialize component
    fixture.detectChanges();
    
    // Check that it redirected to profile
    expect(routerMock.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should redirect to home when user is not authenticated', () => {
    // Set user to not authenticated
    authServiceMock.user$ = of(null);
    
    // Initialize component
    fixture.detectChanges();
    
    // Check that it redirected to home
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });
}); 