import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Import RouterModule
import { MatDialogModule } from '@angular/material/dialog'; // If you use Angular Material Dialog

// Import your shared components
import { MainNavComponent } from 'src/app/components/shared/main-nav/main-nav.component';
import { NavComponent } from 'src/app/components/shared/nav/nav.component';
import { FooterComponent } from 'src/app/components/shared/footer/footer.component';
import { ProfileComponent } from 'src/app/components/profile/profile.component';
import { SpinningBotComponent } from 'src/app/components/shared/spinning-bot/spinning-bot.component';
import { MaterialModule } from '../material-module/material.module';
import { MatMenuModule } from '@angular/material/menu';
@NgModule({
  declarations: [
    MainNavComponent,
    NavComponent,
    FooterComponent,
    SpinningBotComponent,
    ProfileComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule, // If needed for SpinningBotComponent
    MaterialModule,
    MatMenuModule
  ],
  exports: [
    MainNavComponent,
    NavComponent,
    FooterComponent,
    SpinningBotComponent,
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatMenuModule,
  ]
})
export class SharedModule { }
