import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';

// material stuff
import { MaterialModule } from './modules/material-module/material.module';


// Firebase
import { FirebaseModule } from './modules/firebase-module/firebase.module';

//SERVICES
import { UploadService } from './services/upload/upload.service';
// import { AuthGuardService } from './guards/auth-guard/auth-guard.service';

// components
import { AppComponent } from './app.component';
import { NavComponent } from './components/shared/nav/nav.component';
import { UploadComponent } from './components/landing-page/upload/upload.component';
import { DashboardLeftComponent } from './components/dashboard/dashboard-left/dashboard-left.component';
import { DashboardRightComponent } from './components/dashboard/dashboard-right/dashboard-right-component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { DualDialogComponent } from './components/dual-dialog/dual-dialog.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { AboutComponent } from './components/about/about.component';
import { DonateComponent } from './components/donate/donate.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { FourOfourComponent } from './components/four-ofour/four-ofour.component';
import { CompleteComponent } from './components/complete/complete.component';
import { IssueComponent } from './components/issue/issue.component';
import { ScriptComponent } from './components/script/script.component';

import { TextBlockComponent } from './components/shared/text-block/text-block.component';
import { MainNavComponent } from './components/shared/main-nav/main-nav.component';
import { SpinningBotComponent } from './components/shared/spinning-bot/spinning-bot.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminMainComponent } from './components/admin/admin-main/admin-main.component';
import { AdminSideBarComponent } from './components/admin/admin-side-bar/admin-side-bar.component';
import { ConfirmationDialogComponent } from './components/admin/confirmation-dialog/confirmation-dialog.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { LastLooksComponent } from './components/dashboard/last-looks/last-looks.component';
import { LastLooksPageComponent } from './components/dashboard/last-looks-page/last-looks-page.component';
import { TestimonialItemComponent } from './components/landing-page/testimonial/testimonial-item/testimonial-item.component'
import { TestimonialGridComponent } from './components/landing-page/testimonial/testimonial-grid/testimonial-grid.component';
import { FeatureCardComponent } from './components/landing-page/feature/feature-card/feature-card.component';
import { FeatureGridComponent } from './components/landing-page/feature/feature-grid/feature-grid.component';
import { AboutItemComponent } from './components/landing-page/about/about-item/about-item.component';
import { AboutItemGridComponent } from './components/landing-page/about/about-item-grid/about-item-grid.component';
import { AddWatermarkComponent } from './components/add-watermark/add-watermark.component';

import { AddCallsheetComponent } from './components/add-callsheet/add-callsheet.component';
import { ToolTipComponent } from './components/shared/tool-tip/tool-tip.component'

@NgModule({
    declarations: [
        AppComponent,
        UploadComponent,
        DashboardRightComponent,
        DashboardComponent,
        NavbarComponent,
        NavComponent,
        ScriptComponent,
        CompleteComponent,
        IssueComponent,
        DualDialogComponent,
        FooterComponent,
        AboutComponent,
        DonateComponent,
        FeedbackComponent,
        FourOfourComponent,
        TextBlockComponent,
        MainNavComponent,
        SpinningBotComponent,
        UploadComponent,
        AdminComponent,
        AdminMainComponent,
        AdminSideBarComponent,
        ConfirmationDialogComponent,
        CheckoutComponent,
        LastLooksComponent,
        LastLooksPageComponent,
        TestimonialItemComponent,
        TestimonialGridComponent,
        FeatureCardComponent,
        FeatureGridComponent,
        AboutItemComponent,
        AboutItemGridComponent,
        AddWatermarkComponent,
        AddCallsheetComponent,
        ToolTipComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        LayoutModule,
        MaterialModule,
        FirebaseModule
   
  
    ],
    providers: [
        DatePipe,
        UploadService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
