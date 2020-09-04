import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from '../upload.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit, OnDestroy {
  fileToUpload: File
  dataSubscription: Subscription
  constructor(public upload:UploadService, public router:Router) { }
  lines:any[]
  $script_data:Observable<any>
  ngOnInit(): void {

    this.upload.lineArr = [];

  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.

    this.dataSubscription.unsubscribe()

 }
  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
    localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ""))
    this.$script_data = this.upload.postFile(this.fileToUpload)
    this.dataSubscription = this.$script_data.subscribe(data=>{
      console.log(data)
      this.lines = data[0]
      this.upload.lineArr = data[0]
      this.upload.issues = data[1]
      this.router.navigate(["download"])

    })
    
 

    

}
  
}
