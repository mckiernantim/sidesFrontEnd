
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import 'jasmine'
const scriptData =  JSON.parse(require("./classifiedTestData.json"))
describe('DashboardRightComponent', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let uploadServiceStub: Partial<UploadService>;

  beforeEach(async () => {
    // Create stubs for the required services and inject them into the component
    uploadServiceStub = {
      lineArr: scriptData,
      pagesArr: [1, 2, 3],
    };


    await TestBed.configureTestingModule({
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceStub },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

})
