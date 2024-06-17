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
    this.restartAutoScroll();
  }

  prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.posters.length) % this.posters.length;
    this.updateVisibleImage();
    this.restartAutoScroll();
  }

  updateVisibleImage(): void {
    this.isTransitioning = true;
    this.cd.detectChanges(); 

    setTimeout(() => {
      this.visibleImage = this.posters[this.currentIndex].imageUrl;
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
