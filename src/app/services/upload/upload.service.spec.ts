import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UploadService } from './upload.service';
import { environment } from 'src/environments/environment';
describe('UploadService', () => {
  let service: UploadService;
  let httpTestingController: HttpTestingController;
  const url = environment.url


  beforeEach(() => {
  

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UploadService,
      
      ]
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
    const spy = spyOn(service, 'postFile').and.callThrough();
  
    service.postFile(mockFile).subscribe(response => {
      // Handle response
      console.log(`response from our server: ${response}`)
    });
  
    const req = httpTestingController.expectOne(`${url}/api`);
    expect(req.request.method).toBe('POST');
    expect(spy).toHaveBeenCalled();
    req.flush({ /* Mock response data */ });
  });
 // we should in the future build out some testing routes on a dev server for this 
  // as of right now there are no reoutes avaialale to just test if a file was uploaded

  // it('should get file from the server', () => {
  //   const mockFileName = 'testScript';
  //   service.getFile(mockFileName).subscribe(response => {
  //     // Expectations on response
  //   });
  
  //   const req = httpTestingController.expectOne(`${service.url}/download?name=${mockFileName}`);
  //   expect(req.request.method).toBe('GET');
  //   req.flush(new Blob(), { status: 200, statusText: 'OK' });
  // });
  

});
