import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UploadService } from './upload.service';
import Cookies from 'js-cookie';
import { TokenService } from '../token/token.service';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  const dummyPdfData = {
    allLines: [],
    allChars: [],
    individualPages: [],
    title: 'Test Title',
    firstAndLastLinesOfScenes: []
  };

  beforeEach(() => {
    const tokenServiceStub = {};

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UploadService,
        { provide: TokenService, useValue: tokenServiceStub }
      ]
    });

    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should delete final document', () => {
    const tokenId = 'testTokenId';
    const sessionToken = 'testSessionToken';
    jest.spyOn(Cookies, 'get').mockReturnValue({ 'session_token': sessionToken });

    service.deleteFinalDocument(tokenId).subscribe((response) => {
      expect(response).toEqual({});
    });

    const req = httpMock.expectOne(`${environment.url}/delete`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${sessionToken}`);
    req.flush({});
  });
});

