import { UploadService } from './upload.service';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadComponent } from './upload/upload.component';
import { DashboardLeftComponent } from './dashboard-left/dashboard-left.component';
import { DashboardRightComponent } from './dashboard-right/dashboard-right-component'
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavbarComponent } from './navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavComponent } from './nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';

// material stuff

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { ScriptComponent } from './script/script.component'
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { FormsModule } from '@angular/forms';
import { CompleteComponent } from './complete/complete.component';
import { IssueComponent } from './issue/issue.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule} from "@angular/material/progress-spinner"

// Firebase
import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { DualDialogComponent } from './dual-dialog/dual-dialog.component';
import { FooterComponent } from './footer/footer.component';
import { AboutComponent } from './about/about.component';
import { DonateComponent } from './donate/donate.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { FourOfourComponent } from './four-ofour/four-ofour.component'
import { AuthGuardService } from './auth-guard.service';
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
    FourOfourComponent
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebaseConfig, 'sideWays'),
    AngularFireModule,
    AngularFirestoreModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LayoutModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatCardModule,
    MatProgressSpinnerModule,
    
 
  ],
  providers: [ 
    DatePipe,
    UploadService,
    AuthGuardService
  ],
  entryComponents: [
    IssueComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
