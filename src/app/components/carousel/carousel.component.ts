import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { posters } from './posters';
import { Poster } from 'src/app/types/Poster';
import { Testimonial, testimonials } from './testimonials';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-carousel',
    templateUrl: './carousel.component.html',
    styleUrls: ['./carousel.component.css'],
    animations: [
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('500ms', style({ opacity: 1 })),
            ]),
            transition(':leave', [
                animate('500ms', style({ opacity: 0 }))
            ])
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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
  preloadedImages: HTMLImageElement[] = [];
  autoPlayDelay = 5000; // 5 seconds

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.posters = posters;
    this.testimonials = testimonials;
    this.currentTestimonial = this.testimonials[this.testimonialIndex];
    this.visibleImage = this.posters[this.currentIndex]?.imageUrl || 'assets/testimonials/default-poster.jpg';
    this.preloadImages();
    
    setTimeout(() => {
      this.startAutoScroll();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearAutoScroll();
    this.preloadedImages = []; 
  }

  preloadImages(): void {
    
    this.posters.forEach(poster => {
      if (poster.imageUrl) {
        const img = new Image();
        img.src = poster.imageUrl;
        this.preloadedImages.push(img);
      }
    });
    
    // Also preload avatar images
    this.testimonials.forEach(testimonial => {
      if (testimonial.avatarUrl) {
        const img = new Image();
        img.src = testimonial.avatarUrl;
        this.preloadedImages.push(img);
      }
    });
  }

  next(): void {
    if (this.isTransitioning) return; // Prevent rapid clicking
    
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex + 1) % this.posters.length;
    this.testimonialIndex = (this.testimonialIndex + 1) % this.testimonials.length;
    this.updateVisibleImageAndTestimonial();
    this.restartAutoScroll();
  }

  prev(): void {
    if (this.isTransitioning) return; // Prevent rapid clicking
    
    this.isTransitioning = true;
    this.currentIndex = (this.currentIndex - 1 + this.posters.length) % this.posters.length;
    this.testimonialIndex = (this.testimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
    this.updateVisibleImageAndTestimonial();
    this.restartAutoScroll();
  }

  updateVisibleImageAndTestimonial(): void {
    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.visibleImage = this.posters[this.currentIndex]?.imageUrl || 'assets/testimonials/default-poster.jpg';
        this.currentTestimonial = this.testimonials[this.testimonialIndex];
        this.isTransitioning = false;
        this.cd.markForCheck(); // Use markForCheck instead of detectChanges for better performance
      }, 300);
    });
  }

  startAutoScroll(): void {
    this.clearAutoScroll(); // Clear any existing interval
    this.autoScrollInterval = setInterval(() => {
      this.next();
    }, this.autoPlayDelay);
  }

  restartAutoScroll(): void {
    this.clearAutoScroll();
    this.startAutoScroll();
  }

  clearAutoScroll(): void {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  // Pause auto-scroll when user hovers over carousel
  pauseAutoScroll(): void {
    this.clearAutoScroll();
  }

  // Resume auto-scroll when user leaves carousel
  resumeAutoScroll(): void {
    this.startAutoScroll();
  }
  
  // Jump to a specific slide
  goToSlide(index: number): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    this.currentIndex = index;
    this.testimonialIndex = index;
    this.updateVisibleImageAndTestimonial();
    this.restartAutoScroll();
  }
}
