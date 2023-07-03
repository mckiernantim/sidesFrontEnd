import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { UploadComponent } from './upload.component';
import { UploadService } from '../../services/upload/upload.service';
import { SpinningBotComponent } from '../spinning-bot/spinning-bot.component';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let uploadServiceSpy: jasmine.SpyObj<UploadService>;

  beforeEach(async(() => {
    const spy = jasmine.createSpyObj('UploadService', ['postFile']);
    TestBed.configureTestingModule({
      declarations: [ UploadComponent, SpinningBotComponent ],
      imports: [ HttpClientTestingModule, MatDialogModule, RouterTestingModule ],
      providers: [
        { provide: UploadService, useValue: spy },
      ]
    })
    .compileComponents();
    uploadServiceSpy = TestBed.inject(UploadService) as jasmine.SpyObj<UploadService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleFileInput', () => {
    it('should call upload service to post file and subscribe to result', () => {
      const file = new File(['mock data'], 'mock.pdf', {type: 'application/pdf'});
      const data = [[{text: 'line 1', category: 'category1'}, {text: 'line 2', category: 'category2'}], [], [], 'ip address'];
      uploadServiceSpy.postFile.and.returnValue(of(data));
      component.handleFileInput(new FileList([file]));
      expect(uploadServiceSpy.postFile).toHaveBeenCalledWith(file);
      expect(component.$script_data).toBeDefined();
      component.$script_data.subscribe(result => {
        expect(result).toEqual(data);
        expect(component.lines).toEqual(data[0]);
        expect(component.upload.lineArr).toEqual(data[0]);
        expect(component.upload.pagesArr).toEqual(data[1]);
        expect(component.upload.lineCount).toEqual(data[1].map(p => p.filter(i => i.totalLines)));
        expect(component.dialog.closeAll).toHaveBeenCalled();
        expect(component.router.navigate).toHaveBeenCalledWith(['download']);
      });
    });

    it('should set error message if upload service fails', () => {
      const file = new File(['mock data'], 'mock.pdf', {type: 'application/pdf'});
      const errorMsg = 'Upload failed';
      uploadServiceSpy.postFile.and.returnValue(new Observable(observer => observer.error(errorMsg)));
      component.handleFileInput(new FileList([file]));
      expect(component.$script_data).toBeDefined();
      component.$script_data.subscribe(
        () => {},
        error => {
          expect(error).toEqual(errorMsg);
          expect(component.dialog.closeAll).toHaveBeenCalled();
        }
      );
    });
  });

  describe('addTwo', () => {
    it('should find the index of the first line with "2." text and "page-number-hidden" category and return it', () => {
      const lines = [
        {text: 'line 1', category: 'category1'},
        {text: '2. line 2', category: 'page-number-hidden'},
        {text: 'line 3', category: 'category2'}
      ];
      const index = component.addTwo(lines);
      expect(index).toEqual(1);
    });
  })
  it('should return "2." if no element matches "2." and has a category of "page-number-hidden"', () => {
    const arr = [      { text: '1', category: 'page-number' },      { text: '3', category: 'page-number' },      { text: '4', category: 'page-number' },    ];
    expect(component.addTwo(arr)).toEqual("2.");
  });


})
