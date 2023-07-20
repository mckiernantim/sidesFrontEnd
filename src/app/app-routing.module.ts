import { FourOfourComponent } from './components/four-ofour/four-ofour.component';
import { DonateComponent } from './components/donate/donate.component';
import { AboutComponent } from './components/about/about.component';
import { CompleteComponent } from './components/complete/complete.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminComponent } from "./components/admin/admin.component"
import { CheckoutComponent } from './components/checkout/checkout.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
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
    // canActivate : [AuthGuard],
  },
  { path: 'About', component: AboutComponent },
  { path: 'Donate', component: DonateComponent },
  { path: '', component: UploadComponent },
  { path: 'Home', component: UploadComponent },
  { path: 'Checkout', component: CheckoutComponent },
  { path: "**", component:FourOfourComponent}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes, {})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
