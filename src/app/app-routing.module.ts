import { CompleteComponent } from './complete/complete.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UploadComponent } from './upload/upload.component';


const routes: Routes = [
  { path: 'download', component: DashboardComponent},
  { path: 'complete', component: CompleteComponent},
  { path: '', component: UploadComponent},
 
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
