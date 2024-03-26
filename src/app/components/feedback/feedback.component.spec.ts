import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackComponent } from './feedback.component';
import { AuthService } from '../../services/auth/auth.service';
import { FeedbackService } from '../../services/feedback/feedback.service';
import { FeedbackTicket } from '../../types/feedbackTicket';
import { of } from 'rxjs';

describe('FeedbackComponent', () => {
  let component: FeedbackComponent;
  let fixture: ComponentFixture<FeedbackComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let feedbackServiceMock: jasmine.SpyObj<FeedbackService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', [], { userData: { email: 'test@example.com' } });
    feedbackServiceMock = jasmine.createSpyObj('FeedbackService', ['postTicket', 'categories']);

    await TestBed.configureTestingModule({
      declarations: [FeedbackComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: FeedbackService, useValue: feedbackServiceMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ... [Rest of your tests]
});
