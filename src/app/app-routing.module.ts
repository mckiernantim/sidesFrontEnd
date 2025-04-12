import { FourOfourComponent } from './components/four-ofour/four-ofour.component';
import { DonateComponent } from './components/donate/donate.component';
import { AboutComponent } from './components/about/about.component';
import { CompleteComponent } from './components/complete/complete.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './components/landing-page/upload/upload.component'
import { TokenGuard } from './guards/token/token.guard';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserGuard } from './guards/user/user.guard';
import { SubscriptionComponent } from './components/subscription/subscription.component';
import { ProfileLoaderComponent } from './components/profile/profile-loader.component';
import { AuthGuard } from './guards/auth.guard'
import { TestComponent } from './components/test/test.component';

const routes: Routes = [
  { path: 'test', component: TestComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  { 
    path: 'complete', 
    component: CompleteComponent,
    canActivate: [AuthGuard, TokenGuard]
  },
  { path: 'About', component: AboutComponent },
  { path: 'Donate', component: DonateComponent },
  { path: '', component: UploadComponent },
  { path: 'Home', component: UploadComponent },
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'Checkout', component: CheckoutComponent },
  { path: 'profile-loader', component: ProfileLoaderComponent },
  { path: 'profile', component: ProfileComponent },
  { path: "**", component:FourOfourComponent}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes, 
    // { enableTracing: true }
    )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
