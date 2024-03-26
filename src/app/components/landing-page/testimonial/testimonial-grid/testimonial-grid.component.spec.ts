import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestimonialGridComponent } from './testimonial-grid.component';

describe('TestimonialGridComponent', () => {
  let component: TestimonialGridComponent;
  let fixture: ComponentFixture<TestimonialGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestimonialGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestimonialGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
