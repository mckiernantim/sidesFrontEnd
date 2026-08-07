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
import { DocumentResetGuard } from './guards/document-reset.guard';
import { ProjectResolveGuard } from './guards/project-resolve.guard';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { ProfileComponent } from './components/profile/profile.component';

import { ProfileLoaderComponent } from './components/profile/profile-loader.component';
import { AuthComponent } from './components/auth/auth.component';
import { AuthGuard } from './guards/auth.guard'
import { TestComponent } from './components/test/test.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { ContactComponent } from './components/contact/contact.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { SchedulePageComponent } from './components/schedule/schedule-page/schedule-page.component';
import { PostLoginChoiceComponent } from './components/project-library/post-login-choice/post-login-choice.component';
import { MyProjectsComponent } from './components/project-library/my-projects/my-projects.component';
import { HelpCenterComponent } from './components/help-center/help-center.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './components/terms-of-service/terms-of-service.component';
import { CookiePolicyComponent } from './components/cookie-policy/cookie-policy.component';

const routes: Routes = [
  { path: 'test', component: TestComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    // Resumes a saved project: ProjectResolveGuard hydrates UploadService/PdfService
    // via ProjectService.openProject(), then navigates to /dashboard itself.
    // This route's own component is never activated (see ProjectResolveGuard).
    path: 'project/:id',
    component: DashboardComponent,
    canActivate: [AuthGuard, ProjectResolveGuard],
  },
  { 
    path: 'complete', 
    component: CompleteComponent,
    canActivate: [AuthGuard, TokenGuard]
  },
  { path: 'About', component: AboutComponent },
  { path: 'Donate', component: DonateComponent },
  { path: '', component: UploadComponent, canActivate: [DocumentResetGuard] },
  { path: 'Home', component: UploadComponent, canActivate: [DocumentResetGuard] },
  { path: 'payment-success', component: PaymentSuccessComponent },
  { path: 'Checkout', component: CheckoutComponent },
  { path: 'profile-loader', component: ProfileLoaderComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'schedule', component: SchedulePageComponent, canActivate: [AuthGuard] },
  { path: 'schedule/:id', component: SchedulePageComponent, canActivate: [AuthGuard] },
  // Spec 028 US1 — post-login choice for scheduling-tier users, and the saved-project library.
  { path: 'start', component: PostLoginChoiceComponent, canActivate: [AuthGuard] },
  { path: 'my-projects', component: MyProjectsComponent, canActivate: [AuthGuard] },
  { path: 'about', component: AboutComponent },
  { path: 'pricing', component: PricingComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'help', component: HelpCenterComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
  { path: 'terms', component: TermsOfServiceComponent },
  { path: 'cookie-policy', component: CookiePolicyComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'sign-in', redirectTo: 'auth', pathMatch: 'full' },
  { path: "**", component:FourOfourComponent}
 ];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
