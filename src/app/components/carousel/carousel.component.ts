import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { posters } from './posters';
import { Poster } from 'src/app/types/Poster';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit, OnDestroy {
  posters: Poster[] = [];
  currentIndex = 0;
  visibleImage: string = '';
  isTransitioning = false;
  autoScrollInterval: any;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.posters = posters;
    this.updateVisibleImage();
    this.startAutoScroll();
  }

  ngOnDestroy(): void {
    clearInterval(this.autoScrollInterval);
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.posters.length;
    this.updateVisibleImage();
  }

  prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.posters.length) % this.posters.length;
    this.updateVisibleImage();
  }

  updateVisibleImage(): void {
    this.isTransitioning = true;
    this.cd.detectChanges(); // Trigger change detection to apply the transition

    setTimeout(() => {
      this.visibleImage = this.posters[this.currentIndex].imageUrl;
      this.isTransitioning = false;
      this.cd.detectChanges(); // Trigger change detection again to remove the transition class
    }, 500); // Match this duration with your CSS transition duration
  }

  startAutoScroll(): void {
    this.autoScrollInterval = setInterval(() => {
      this.next();
    }, 3000); // Change image every 3 seconds
  }
}
