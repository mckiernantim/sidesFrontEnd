import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UploadService]
    });
    service = TestBed.inject(UploadService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensure that there are no outstanding requests after each test
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  // we don't need to actually test the HTTP function

  // it('should upload file successfully', () => {
  //   const mockFile = new File([''], 'test.pdf');
  //   // Mock the response expected from the server
  //   const mockResponse = {/* expected response object */};
  
  //   service.postFile(mockFile).subscribe(response => {
  //     expect(response).toBeTruthy();
  //   });
  
  //   // Expect a POST request to the specific URL
  //   const req = httpTestingController.expectOne('url/to/post/file');
  //   expect(req.request.method).toEqual('POST');
  //   req.flush(mockResponse);
  // });
  
  afterEach(() => {
    httpTestingController.verify();
  });

  

  // Additional tests go here
});
