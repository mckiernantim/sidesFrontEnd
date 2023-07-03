import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackComponent } from './feedback.component';
import { UploadService } from '../../services/upload/upload.service';
import { AuthService } from '../../services/auth/auth.service';
import { FeedbackService } from '../../services/feedback/feedback.service';
import { FeedbackTicket } from '../../types/feedbackTicket';

describe('FeedbackComponent', () => {
  let component: FeedbackComponent;
  let fixture: ComponentFixture<FeedbackComponent>;
  let uploadService: UploadService;
  let authService: AuthService;
  let feedbackService: FeedbackService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FeedbackComponent],
      providers: [UploadService, AuthService, FeedbackService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackComponent);
    component = fixture.componentInstance;
    uploadService = TestBed.inject(UploadService);
    authService = TestBed.inject(AuthService);
    feedbackService = TestBed.inject(FeedbackService);
  });

  it('should initialize categories and currentTicket in ngOnInit', () => {
    const categories = ['Category1', 'Category2'];
    component.categories = categories;
  
    component.ngOnInit();
  
    expect(component.categories).toEqual(categories);
    expect(component.currentTicket).toEqual(
      jasmine.objectContaining<FeedbackTicket>({
        title: component.title || "no title",
        category: component.categories[0],
        text: 'Describe any issues',
        date: jasmine.anything(),
        email: ''
      })
    );
  });

  it('should set date, email, and call postTicket in onSubmit', () => {
    const currentDate = new Date();
    spyOn(window, 'Date').and.returnValue(currentDate);
    const postTicketSpy = spyOn(feedbackService, 'postTicket');

    component.auth = { userData: { email: 'test@example.com' } } as AuthService;
    component.currentTicket = new FeedbackTicket(
      'Initial Title',
      'Initial Description',
      component.categories[0],
      'Initial Issues',
      new Date().toString(),
      true,
      'Initial Comment'
    );
    component.onSubmit();

    expect(component.currentTicket.date).toBe(currentDate.toISOString());
    expect(component.currentTicket.email).toBe('test@example.com');
    expect(postTicketSpy).toHaveBeenCalledWith(component.currentTicket);
    expect(component.currentTicket).toEqual(
      new FeedbackTicket(
        component.title || "no title",
        "",
        component.categories[0],
        'Describe any issues',
        new Date().toString(),
        false,
        ""
      )
    );
  });

  it('should reset currentTicket in resetForm', () => {
    component.auth = { userData: { email: 'test@example.com' } } as AuthService;
    component.resetForm();

    expect(component.currentTicket).toEqual(
      new FeedbackTicket(
        component.title || "no title",
        "",
        component.categories[0],
        'Describe any issues',
        new Date().toString(),
        false,
        'test@example.com'
      )
    );
  });
});