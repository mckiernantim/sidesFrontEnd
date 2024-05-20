import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';


import { LayoutModule } from '@angular/cdk/layout';

// material stuff
import { MaterialModule } from './modules/material-module/material.module';
// Firebase
import { FirebaseModule } from './modules/firebase-module/firebase.module';

import { UploadModule } from './modules/upload-module/upload.module';

//SERVICES
import { UploadService } from './services/upload/upload.service';
// import { AuthGuardService } from './guards/auth-guard/auth-guard.service';

// components
import { AppComponent } from './app.component';
import { AboutComponent } from './components/about/about.component';
import { DonateComponent } from './components/donate/donate.component';

import { CompleteComponent } from './components/complete/complete.component';
import { IssueComponent } from './components/issue/issue.component';
import { ScriptComponent } from './components/script/script.component';



import { CheckoutComponent } from './components/checkout/checkout.component';


import { WarningComponent } from "./components/warning/warning.component"
import { SharedModule } from './modules/shared-module/shared.module';
import { DashboardModule } from './modules/dashboard-module/dashboard.module';

@NgModule({
    declarations: [
        AppComponent,
        ScriptComponent,
        CompleteComponent,
        IssueComponent,
        AboutComponent,
        DonateComponent,
        CheckoutComponent,
        WarningComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        LayoutModule,
        MaterialModule,
        FirebaseModule,
        FormsModule,
        UploadModule,
        DashboardModule,
        SharedModule,
    ],
    

  
    providers: [
        DatePipe,
    ],

    bootstrap: [AppComponent]
})
export class AppModule {}
