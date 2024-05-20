// upload.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MatDialogModule } from '@angular/material/dialog';
import { UploadComponent } from '../../components/landing-page/upload/upload.component';

import { FeatureGridComponent } from 'src/app/components/landing-page/feature/feature-grid/feature-grid.component';
import { AboutItemGridComponent } from 'src/app/components/landing-page/about/about-item-grid/about-item-grid.component';
import { FeatureCardComponent } from 'src/app/components/landing-page/feature/feature-card/feature-card.component';
import { AboutItemComponent } from 'src/app/components/landing-page/about/about-item/about-item.component';
import { TestimonialGridComponent } from 'src/app/components/landing-page/testimonial/testimonial-grid/testimonial-grid.component';
import { SharedModule } from '../shared-module/shared.module';

@NgModule({
  declarations: [
    UploadComponent,
    FeatureGridComponent,
    AboutItemGridComponent,
    TestimonialGridComponent,
    AboutItemComponent,
    FeatureCardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    SharedModule
  ],
  exports: [
    UploadComponent
  ]
})
export class UploadModule { }
