import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import your shared components
import { MainNavComponent } from '../../components/shared/main-nav/main-nav.component';
import { NavComponent } from 'src/app/components/shared/nav/nav.component';
import { FooterComponent } from '../../components/shared/footer/footer.component';
import { SpinningBotComponent } from 'src/app/components/shared/spinning-bot/spinning-bot.component';
import { AboutItemGridComponent } from 'src/app/components/landing-page/about/about-item-grid/about-item-grid.component';
import { CarouselComponent } from 'src/app/components/carousel/carousel.component';

import { DatePipe, AsyncPipe } from '@angular/common';
import { DateFormatPipe } from 'src/app/pipes/date-format.pipe';
import { TailwindDialogComponent } from 'src/app/components/shared/tailwind-dialog/tailwind-dialog.component';
import { TailwindTableComponent } from 'src/app/components/shared/tailwind-table/tailwind-table.component';
import { TailwindTableColumnDirective } from 'src/app/components/shared/tailwind-table/tailwind-table-column.directive';

@NgModule({
  declarations: [
    NavComponent,
    FooterComponent,
    SpinningBotComponent,
    MainNavComponent,
    AboutItemGridComponent,
    CarouselComponent,
    DateFormatPipe,
    TailwindDialogComponent,
    TailwindTableComponent,
    TailwindTableColumnDirective
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  exports: [
    NavComponent,
    FooterComponent,
    SpinningBotComponent,
    AboutItemGridComponent,
    CarouselComponent,
    CommonModule,
    RouterModule,
    FormsModule,
    MainNavComponent,
    DateFormatPipe,
    TailwindDialogComponent,
    TailwindTableComponent,
    TailwindTableColumnDirective
  ],
  providers: [DatePipe, AsyncPipe, DateFormatPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
