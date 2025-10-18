// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { SubscriptionDialogComponent } from './subscription-dialog.component';

// describe('SubscriptionDialogComponent', () => {
//   let component: SubscriptionDialogComponent;
//   let fixture: ComponentFixture<SubscriptionDialogComponent>;
//   let authServiceMock: jasmine.SpyObj<AuthService>;
//   let routerMock: jasmine.SpyObj<Router>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [SubscriptionDialogComponent],
//       providers: [
//         AuthGuard,
//         // { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['isAuthenticated']) },
//         { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
//       ]
//     })
//     .compileComponents();
    
//     fixture = TestBed.createComponent(SubscriptionDialogComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();

//     authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
//     routerMock = TestBed.inject(Router) as jasmine.SpyObj<Router>;
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should allow access when user is authenticated', () => {
//     authServiceMock.isAuthenticated.and.returnValue(true);
    
//     const canActivate = TestBed.inject(AuthGuard).canActivate(null!, null!);
    
//     expect(canActivate).toBeTrue();
//     expect(routerMock.navigate).not.toHaveBeenCalled();
//   });

//   it('should redirect to login when user is not authenticated', () => {
//     authServiceMock.isAuthenticated.and.returnValue(false);
    
//     const canActivate = TestBed.inject(AuthGuard).canActivate(null!, null!);
    
//     expect(canActivate).toBeFalse();
//     expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
//   });
// });
