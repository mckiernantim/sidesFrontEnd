import { FourOfourComponent } from './four-ofour/four-ofour.component';
import { DonateComponent } from './donate/donate.component';
import { AboutComponent } from './about/about.component';
import { CompleteComponent } from './complete/complete.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from "./admin/admin.component"

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { AuthGuard } from './guards/auth.guard';


const routes: Routes = [
  {
    path: 'download',
    component: DashboardComponent,
  },
  {
    path:"super-secret",
    component: AdminComponent,
  },
  { path: 'complete',
    component: CompleteComponent,
    canActivate : [AuthGuard],
  },
  { path: 'About', component: AboutComponent },
  { path: 'Donate', component: DonateComponent },
  { path: '', component: UploadComponent },
  { path: 'Home', component: UploadComponent },
  { path: "**", component:FourOfourComponent}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
