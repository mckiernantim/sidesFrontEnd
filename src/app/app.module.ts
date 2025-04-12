import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { FirebaseModule } from './modules/firebase-module/firebase.module';

import { AboutComponent } from './components/about/about.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { ContactComponent } from './components/contact/contact.component';
import { DonateComponent } from './components/donate/donate.component';
import { IssueComponent } from './components/issue/issue.component';
import { UploadModule } from './modules/upload-module/upload.module';
import { DashboardModule } from './modules/dashboard-module/dashboard.module';
import { SharedModule } from './modules/shared-module/shared.module';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { ProfileComponent } from './components/profile/profile.component';
import { TestComponent } from './components/test/test.component';
import { HttpLogInterceptor } from './services/http-interceptor.service';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
@NgModule({
  declarations: [
    AppComponent,
    AboutComponent,
    PricingComponent,
    ContactComponent,
    DonateComponent,
    IssueComponent,
    ProfileComponent,
    PaymentSuccessComponent,
    TestComponent,
    HowItWorksComponent,
    PricingComponent,
    AboutComponent,
    ContactComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    UploadModule,
    SharedModule,
    DashboardModule,
    FirebaseModule.forRoot()
  ],
  providers: [
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: HttpLogInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
