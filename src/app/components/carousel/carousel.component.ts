import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { posters } from './posters';
import { Poster } from 'src/app/types/Poster';
import { Testimonial, testimonials } from './testimonials';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, OnDestroy {

  posters: Poster[] = [];
  testimonials: Testimonial[] = [];
  currentIndex = 0;
  testimonialIndex = 0;
  currentTestimonial: Testimonial;
  visibleImage: string = '';
  isTransitioning = false;
  autoScrollInterval: any;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.posters = posters;
    this.testimonials = testimonials;
    this.currentTestimonial = this.testimonials[this.testimonialIndex]; // Initialize currentTestimonial
    this.updateVisibleImageAndTestimonial();
    this.startAutoScroll();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoScrollInterval);
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.posters.length;
    this.testimonialIndex = (this.testimonialIndex + 1) % this.testimonials.length;
    this.updateVisibleImageAndTestimonial();
    this.restartAutoScroll();
  }

  prev(): void {
    
    this.currentIndex = (this.currentIndex - 1 + this.posters.length) % this.posters.length;
    this.testimonialIndex = (this.testimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
    this.updateVisibleImageAndTestimonial();
    this.restartAutoScroll();
  }

  updateVisibleImageAndTestimonial(): void {
    this.isTransitioning = true;
    this.cd.detectChanges(); 

    setTimeout(() => {
      this.visibleImage = this.posters[this.currentIndex].imageUrl;
      this.currentTestimonial = this.testimonials[this.testimonialIndex];
      this.isTransitioning = false;
      this.cd.detectChanges(); 
    }, 1000); 
  }

  startAutoScroll(): void {
    this.autoScrollInterval = setInterval(() => {
      this.next();
    }, 5000);
  }

  restartAutoScroll(): void {
    clearInterval(this.autoScrollInterval);
    this.startAutoScroll();
  }
}
