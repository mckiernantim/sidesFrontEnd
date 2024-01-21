import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UploadService } from './upload.service';
import { environment } from 'src/environments/environment';

describe('UploadService', () => {
  let service: UploadService;
  let httpTestingController: HttpTestingController;
  const url = environment.url;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UploadService]
    });

    service = TestBed.inject(UploadService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify(); // Verify that there are no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post file to the server', () => {
    const mockFile = new File([''], 'test.pdf');
    const mockResponse = {/* Mock response data */};

    service.postFile(mockFile).subscribe(response => {
      expect(response).toEqual(mockResponse); // Verify the response from the service
    });

    const req = httpTestingController.expectOne(`${url}/api`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.has('script')).toBeTrue(); // Check if the FormData contains 'script'
    expect(req.request.body.get('script')).toEqual(mockFile); // Check if the correct file is being sent
    req.flush(mockResponse); // Simulate a server response
  });

  // Additional tests for other methods can be added here
});
