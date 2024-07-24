// upload.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'
import { UploadComponent } from '../../components/landing-page/upload/upload.component';

import { FeatureGridComponent } from 'src/app/components/landing-page/feature/feature-grid/feature-grid.component';
import { AboutItemGridComponent } from 'src/app/components/landing-page/about/about-item-grid/about-item-grid.component';
import { FeatureCardComponent } from 'src/app/components/landing-page/feature/feature-card/feature-card.component';
import { CarouselComponent } from 'src/app/components/carousel/carousel.component';
import { TestimonialGridComponent } from 'src/app/components/landing-page/testimonial/testimonial-grid/testimonial-grid.component';
import { SharedModule } from '../shared-module/shared.module';

@NgModule({
  declarations: [
    UploadComponent,
    FeatureGridComponent,
    AboutItemGridComponent,
    TestimonialGridComponent,
    FeatureCardComponent,
    CarouselComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    SharedModule,
    MatButtonModule
  ],
  exports: [
    UploadComponent
  ]
})
export class UploadModule { }
