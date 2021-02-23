import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { DatePipe } from '@angular/common'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UploadComponent } from './upload/upload.component';
import { DashboardLeftComponent } from './dashboard-left/dashboard-left.component';
import { DashboardRightComponent } from './dashboard-right/dashboard-right.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavbarComponent } from './navbar/navbar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavComponent } from './nav/nav.component';
import { LayoutModule } from '@angular/cdk/layout';
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

// Firebase
import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { DualDialogComponent } from './dual-dialog/dual-dialog.component'
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
    DualDialogComponent
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebaseConfig, 'sideWays'),
    AngularFirestoreModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LayoutModule,
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
    FormsModule,
 
  ],
  providers: [ 
    DatePipe],
  entryComponents: [
    IssueComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
