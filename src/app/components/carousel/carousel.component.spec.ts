import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarouselComponent } from './carousel.component';
import { ChangeDetectorRef } from '@angular/core';
import { posters } from './posters';
import { testimonials } from './testimonials';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;
  let cdRefMock: ChangeDetectorRef;

  beforeEach(async () => {
    cdRefMock = { detectChanges: jest.fn() } as any;

    await TestBed.configureTestingModule({
      declarations: [CarouselComponent],
      providers: [
        { provide: ChangeDetectorRef, useValue: cdRefMock }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize posters and testimonials on ngOnInit', () => {
    component.ngOnInit();
    expect(component.posters).toEqual(posters);
    expect(component.testimonials).toEqual(testimonials);
    expect(component.currentTestimonial).toEqual(testimonials[0]);
  });

  it('should start auto-scroll on ngOnInit', () => {
    jest.useFakeTimers();
    jest.spyOn(component, 'next');

    component.ngOnInit();
    jest.advanceTimersByTime(5000);

    expect(component.next).toHaveBeenCalled();
  });

  it('should clear interval on ngOnDestroy', () => {
    jest.spyOn(global, 'clearInterval');
    component.ngOnDestroy();
    expect(clearInterval).toHaveBeenCalledWith(component.autoScrollInterval);
  });

  it('should toggle isTransitioning and update visibleImage and currentTestimonial in updateVisibleImageAndTestimonial()', () => {
    jest.useFakeTimers();
    component.posters = posters;
    component.testimonials = testimonials;
    component.currentIndex = 0;
    component.testimonialIndex = 0;

    component.updateVisibleImageAndTestimonial();

    expect(component.isTransitioning).toBeTruthy();
    jest.advanceTimersByTime(1000);
    expect(component.visibleImage).toEqual(posters[0].imageUrl);
    expect(component.currentTestimonial).toEqual(testimonials[0]);
    expect(component.isTransitioning).toBeFalsy();
  });

  it('should update to next poster and testimonial on next()', () => {
    jest.useFakeTimers();
    component.posters = posters;
    component.testimonials = testimonials;
    component.currentIndex = 0;
    component.testimonialIndex = 0;

    component.next();

    expect(component.isTransitioning).toBeTruthy();
    jest.advanceTimersByTime(1000);
    expect(component.currentIndex).toEqual(1);
    expect(component.testimonialIndex).toEqual(1);
    expect(component.visibleImage).toEqual(posters[1].imageUrl);
    expect(component.currentTestimonial).toEqual(testimonials[1]);
    expect(component.isTransitioning).toBeFalsy();
  });

  it('should update to previous poster and testimonial on prev()', () => {
    jest.useFakeTimers();
    component.posters = posters;
    component.testimonials = testimonials;
    component.currentIndex = 1;
    component.testimonialIndex = 1;

    component.prev();

    expect(component.isTransitioning).toBeTruthy();
    jest.advanceTimersByTime(1000);
    expect(component.currentIndex).toEqual(0);
    expect(component.testimonialIndex).toEqual(0);
    expect(component.visibleImage).toEqual(posters[0].imageUrl);
    expect(component.currentTestimonial).toEqual(testimonials[0]);
    expect(component.isTransitioning).toBeFalsy();
  });

  it('should restart auto-scroll on navigation', () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'clearInterval')
    jest.spyOn(component, 'startAutoScroll');

    component.restartAutoScroll();

    expect(clearInterval).toHaveBeenCalledWith(component.autoScrollInterval);
    expect(component.startAutoScroll).toHaveBeenCalled();
  });
});
