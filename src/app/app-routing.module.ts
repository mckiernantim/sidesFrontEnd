import { FourOfourComponent } from './four-ofour/four-ofour.component';

import { DonateComponent } from './donate/donate.component';
import { AboutComponent } from './about/about.component';
import { CompleteComponent } from './complete/complete.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './upload/upload.component';


const routes: Routes = [
  { path: 'download', component: DashboardComponent },
  { path: 'complete', component: CompleteComponent },
  { path: 'About', component: AboutComponent },
  { path: 'Donate', component: DonateComponent },
  { path: '', component: UploadComponent },
  { path: 'Home', component: UploadComponent },
  { path: "**", component:FourOfourComponent}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
