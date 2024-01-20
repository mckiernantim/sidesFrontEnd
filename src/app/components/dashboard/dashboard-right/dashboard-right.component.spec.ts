import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRightComponent } from './dashboard-right-component';
import { UploadService } from '../../../services/upload/upload.service';
import { PdfService } from '../../../services/pdf/pdf.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import 'jasmine';

const scriptData = JSON.parse(require("./classifiedTestData.json"));
const mockSelectedScenes;

describe('DashboardRightComponent', () => {
  let component: DashboardRightComponent;
  let fixture: ComponentFixture<DashboardRightComponent>;
  let uploadServiceStub: Partial<UploadService>;
  let pdfServiceStub: Partial<PdfService>;

  beforeEach(async () => {
    uploadServiceStub = {
      lineArr: scriptData,
      pagesArr: [1, 2, 3],
      // ... other necessary stub implementations
    };

    pdfServiceStub = {
      // Mock implementation of PdfService methods
    };

    await TestBed.configureTestingModule({
      declarations: [DashboardRightComponent],
      providers: [
        { provide: UploadService, useValue: uploadServiceStub },
        { provide: PdfService, useValue: pdfServiceStub },
        // ... other providers if needed
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRightComponent);
    component = fixture.componentInstance;
    component.selected = mockSelectedScenes;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should sort selected scenes by sceneIndex', () => {
    component.toggleLastLooks();
    expect(component.selected[0].sceneIndex).toBeLessThanOrEqual(component.selected[1].sceneIndex);
    expect(component.selected[1].sceneIndex).toBeLessThanOrEqual(component.selected[2].sceneIndex);
    // ... continue for other elements
  });

  it('should call processPdf with correct arguments', () => {
    spyOn(component.pdf, 'processPdf');
    component.toggleLastLooks();
    expect(component.pdf.processPdf).toHaveBeenCalledWith(
      mockSelectedScenes,
      component.script,
      component.totalPages,
      component.callsheet
    );
  });

  // ... other tests as needed

});