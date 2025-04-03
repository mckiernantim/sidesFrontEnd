// import { TestBed } from '@angular/core/testing';
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
// import { RouterTestingModule } from '@angular/router/testing';
// import { StripeService } from './stripe.service';
// import { AuthService } from '../auth/auth.service';
// import { of } from 'rxjs';
// import { environment } from 'src/environments/environment';

// describe('StripeService', () => {
//   let service: StripeService;
//   let httpMock: HttpTestingController;
//   let authServiceMock: any;

//   beforeEach(() => {
//     // Create mock for AuthService
//     authServiceMock = {
//       getCurrentUser: jest.fn().mockReturnValue({
//         uid: 'test-user-id',
//         email: 'test@example.com',
//         getIdToken: jest.fn().mockResolvedValue('mock-token')
//       }),
//       user$: of({
//         uid: 'test-user-id',
//         email: 'test@example.com'
//       })
//     };

//     TestBed.configureTestingModule({
//       imports: [
//         HttpClientTestingModule,
//         RouterTestingModule
//       ],
//       providers: [
//         StripeService,
//         { provide: AuthService, useValue: authServiceMock }
//       ]
//     });

//     service = TestBed.inject(StripeService);
//     httpMock = TestBed.inject(HttpTestingController);
//   });

//   afterEach(() => {
//     httpMock.verify();
//   });

//   it('should be created', () => {
//     expect(service).toBeTruthy();
//   });

//   describe('getSubscriptionStatus', () => {
//     it('should return subscription status from API', (done) => {
//       const mockResponse = {
//         active: true,
//         subscription: {
//           status: 'active',
//           originalStartDate: '2023-01-01T00:00:00.000Z',
//           currentPeriodEnd: '2023-02-01T00:00:00.000Z',
//           willAutoRenew: true
//         },
//         usage: {
//           pdfsGenerated: 5
//         }
//       };

//       service.getSubscriptionStatus('test-user-id').subscribe(status => {
//         expect(status).toEqual(mockResponse);
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/subscription-status/test-user-id`);
//       expect(req.request.method).toBe('GET');
//       req.flush(mockResponse);
//     });

//     it('should handle 404 error and return empty status', (done) => {
//       service.getSubscriptionStatus('test-user-id').subscribe(status => {
//         expect(status.active).toBe(false);
//         expect(status.subscription.status).toBeNull();
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/subscription-status/test-user-id`);
//       req.flush('Not found', { status: 404, statusText: 'Not Found' });
//     });
//   });

//   describe('createSubscription', () => {
//     it('should create subscription and return checkout URL', (done) => {
//       const mockResponse = {
//         url: 'https://checkout.stripe.com/test-session'
//       };

//       service.createSubscription('test-user-id', 'test@example.com').subscribe(result => {
//         expect(result.success).toBe(true);
//         expect(result.url).toBe(mockResponse.url);
//         expect(result.checkoutUrl).toBe(mockResponse.url);
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/create-subscription`);
//       expect(req.request.method).toBe('POST');
//       expect(req.request.body).toEqual({ userId: 'test-user-id', userEmail: 'test@example.com' });
//       req.flush(mockResponse);
//     });

//     it('should handle error when creating subscription', (done) => {
//       service.createSubscription('test-user-id', 'test@example.com').subscribe(result => {
//         expect(result.success).toBe(false);
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/create-subscription`);
//       req.error(new ErrorEvent('Network error'));
//     });
//   });

//   describe('createPortalSession', () => {
//     it('should create portal session and return URL', (done) => {
//       const mockResponse = {
//         url: 'https://billing.stripe.com/test-portal'
//       };

//       service.createPortalSession('test-user-id', 'test@example.com').subscribe(result => {
//         expect(result.success).toBe(true);
//         expect(result.url).toBe(mockResponse.url);
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/create-portal-session`);
//       expect(req.request.method).toBe('POST');
//       expect(req.request.body).toEqual({ 
//         userId: 'test-user-id', 
//         userEmail: 'test@example.com',
//         returnUrl: `${window.location.origin}/dashboard`
//       });
//       req.flush(mockResponse);
//     });

//     it('should handle error when creating portal session', (done) => {
//       service.createPortalSession('test-user-id', 'test@example.com').subscribe(result => {
//         expect(result.success).toBe(false);
//         done();
//       });

//       const req = httpMock.expectOne(`${environment.url}/stripe/create-portal-session`);
//       req.error(new ErrorEvent('Network error'));
//     });
//   });
// });
