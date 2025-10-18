// upload.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UploadComponent } from '../../components/landing-page/upload/upload.component';
import { SharedModule } from '../shared-module/shared.module';
import { FeatureGridComponent } from '../../components/landing-page/feature/feature-grid/feature-grid.component';
import { FeatureCardComponent } from '../../components/landing-page/feature/feature-card/feature-card.component';
import { TestimonialGridComponent } from '../../components/landing-page/testimonial/testimonial-grid/testimonial-grid.component';
import { CarouselComponent } from '../../components/carousel/carousel.component';

@NgModule({
  declarations: [
    UploadComponent,
    FeatureGridComponent,
    FeatureCardComponent,
    TestimonialGridComponent,
    CarouselComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  exports: [
    UploadComponent,
    FeatureGridComponent,
    FeatureCardComponent,
    TestimonialGridComponent,
    CarouselComponent
  ],
  providers: [AsyncPipe],

})
export class UploadModule { }
