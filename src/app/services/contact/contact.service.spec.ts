import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContactService, ContactPayload } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContactService],
    });
    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST to the contact function URL', () => {
    const payload: ContactPayload = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Hello',
      message: 'This is a test message',
    };

    service.send(payload).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('contactUs'));
    expect(req.request.method).toBe('POST');
    req.flush('Email sent successfully');
  });

  it('should send the correct payload fields', () => {
    const payload: ContactPayload = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'Support Request',
      message: 'I need some help please',
    };

    service.send(payload).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('contactUs'));
    expect(req.request.body).toEqual(payload);
    req.flush('Email sent successfully');
  });

  it('should set Content-Type header to application/json', () => {
    const payload: ContactPayload = {
      name: 'Test',
      email: 'test@test.com',
      subject: 'Test subject',
      message: 'Test message body',
    };

    service.send(payload).subscribe();

    const req = httpMock.expectOne(r => r.url.includes('contactUs'));
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush('Email sent successfully');
  });

  it('should return the response text on success', () => {
    const payload: ContactPayload = {
      name: 'Test',
      email: 'test@test.com',
      subject: 'Subject',
      message: 'Message body here',
    };
    let result: string | undefined;

    service.send(payload).subscribe(res => (result = res));

    const req = httpMock.expectOne(r => r.url.includes('contactUs'));
    req.flush('Email sent successfully');

    expect(result).toBe('Email sent successfully');
  });

  it('should propagate HTTP errors to the caller', () => {
    const payload: ContactPayload = {
      name: 'Test',
      email: 'test@test.com',
      subject: 'Subject',
      message: 'Message body here',
    };
    let errorCaught = false;

    service.send(payload).subscribe({
      error: () => (errorCaught = true),
    });

    const req = httpMock.expectOne(r => r.url.includes('contactUs'));
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorCaught).toBe(true);
  });
});
