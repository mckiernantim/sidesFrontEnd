import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnotationCanvasComponent } from './annotation-canvas.component';
import { AnnotationStateService } from '../../services/annotation/annotation-state.service';
import { CoordinateService } from '../../services/coordinate/coordinate.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AnnotationCanvasComponent', () => {
  let component: AnnotationCanvasComponent;
  let fixture: ComponentFixture<AnnotationCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnnotationCanvasComponent],
      imports: [HttpClientTestingModule],
      providers: [AnnotationStateService, CoordinateService],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnotationCanvasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default page dimensions', () => {
    expect(component.pageWidth).toBe(800);
    expect(component.pageHeight).toBe(1100);
    expect(component.pageIndex).toBe(0);
  });
});
