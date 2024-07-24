import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarouselComponent } from './carousel.component';
import { ChangeDetectorRef } from '@angular/core';
import { posters } from './posters';
import { testimonials } from './testimonials';

describe('CarouselComponent', () => {
  let component: CarouselComponent;
  let fixture: ComponentFixture<CarouselComponent>;
  let cd: ChangeDetectorRef;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CarouselComponent],
      providers: [ChangeDetectorRef]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CarouselComponent);
    component = fixture.componentInstance;
    cd = TestBed.inject(ChangeDetectorRef);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearInterval(component.autoScrollInterval);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize posters and testimonials on ngOnInit', done => {
    component.ngOnInit();
    expect(component.posters).toEqual(posters);
    expect(component.testimonials).toEqual(testimonials);
    expect(component.currentTestimonial).toEqual(testimonials[0]);

    setTimeout(() => {
      expect(component.visibleImage).toEqual(posters[0].imageUrl);
      done();
    }, 1000);
  });

  it('should clear interval on ngOnDestroy', () => {
    jest.spyOn(global, 'clearInterval');
    component.ngOnDestroy();
    expect(clearInterval).toHaveBeenCalledWith(component.autoScrollInterval);
  });

  it('should go to the next poster and testimonial', () => {
    component.ngOnInit();
    const initialIndex = component.currentIndex;
    const initialTestimonialIndex = component.testimonialIndex;

    component.next();
    expect(component.currentIndex).toBe((initialIndex + 1) % posters.length);
    expect(component.testimonialIndex).toBe((initialTestimonialIndex + 1) % testimonials.length);
  });

  it('should go to the previous poster and testimonial', () => {
    component.ngOnInit();
    const initialIndex = component.currentIndex;
    const initialTestimonialIndex = component.testimonialIndex;

    component.prev();
    expect(component.currentIndex).toBe((initialIndex - 1 + posters.length) % posters.length);
    expect(component.testimonialIndex).toBe((initialTestimonialIndex - 1 + testimonials.length) % testimonials.length);
  });

  it('should update visible image and testimonial', done => {
    component.ngOnInit();
    component.currentIndex = 1;
    component.testimonialIndex = 1;

    component.updateVisibleImageAndTestimonial();
    expect(component.isTransitioning).toBe(true);

    setTimeout(() => {
      expect(component.visibleImage).toBe(posters[1].imageUrl);
      expect(component.currentTestimonial).toBe(testimonials[1]);
      expect(component.isTransitioning).toBe(false);
      done();
    }, 1000);
  });

  it('should start auto scroll', () => {
    jest.useFakeTimers();

    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    component.startAutoScroll();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    const intervalCallback = setIntervalSpy.mock.calls[0][0] as Function;
    expect(typeof intervalCallback).toBe('function');
    expect(setIntervalSpy).toHaveBeenCalledWith(intervalCallback, 5000);

    jest.useRealTimers();
  });

 

  
});
