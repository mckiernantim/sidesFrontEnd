import { NavComponent } from './components/nav/nav.component';
import { UploadService } from './services/upload/upload.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadComponent } from './components/upload/upload.component';
import { DashboardLeftComponent } from './components/dashboard-left/dashboard-left.component';
import { DashboardRightComponent } from './components/dashboard-right/dashboard-right-component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';

// material stuff

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { ScriptComponent } from './components/script/script.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { CompleteComponent } from './components/complete/complete.component';
import { IssueComponent } from './components/issue/issue.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatCheckboxModule} from '@angular/material/checkbox';

// Firebase

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { AngularFirestoreModule } from '@angular/fire/compat/Firestore';
import { environment } from '../environments/environment';

// componeents
import { DualDialogComponent } from './components/dual-dialog/dual-dialog.component';
import { FooterComponent } from './components/footer/footer.component';
import { AboutComponent } from './components/about/about.component';
import { DonateComponent } from './components/donate/donate.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { FourOfourComponent } from './components/four-ofour/four-ofour.component';
import { AuthGuardService } from './services/auth-guard/auth-guard.service';
import { TextBlockComponent } from './components/text-block/text-block.component';
import { MainNavComponent } from './components/main-nav/main-nav.component';
import { SpinningBotComponent } from './components/spinning-bot/spinning-bot.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminMainComponent } from './components/admin/admin-main/admin-main.component';
import { AdminSideBarComponent } from './components/admin/admin-side-bar/admin-side-bar.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AddCallsheetComponent } from './components/add-callsheet/add-callsheet.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { LastLooksComponent } from './components/last-looks/last-looks.component';
import { LastLooksPageComponent } from './components/last-looks-page/last-looks-page.component';

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
        AdminComponent,
        AdminMainComponent,
        AdminSideBarComponent,
        ConfirmationDialogComponent,
        AddCallsheetComponent,
        CheckoutComponent,
        LastLooksComponent,
        LastLooksPageComponent,
    ],
    imports: [
      AngularFireModule,
       AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFireAnalyticsModule,
        AngularFirestoreModule,
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        LayoutModule,
        FormsModule,
        MatToolbarModule,
        MatCardModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatListModule,
        MatFormFieldModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatCheckboxModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatGridListModule
    ],
    providers: [
        DatePipe,
        UploadService,
        AuthGuardService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
