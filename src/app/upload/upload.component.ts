
import { AngularFirestore } from '@angular/fire/firestore';
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
  funData: Observable<any>
  totalLines:Subscription
  totalScenes:Subscription
  totalCharacters:Subscription
  dataSubscription: Subscription
  constructor(public db:AngularFirestore, public upload:UploadService, public router:Router) {
    this.db =db;
    
    this.funData = db.collection('funData').doc('totalLines').valueChanges();
    this.totalLines;
    this.funData.subscribe(doc => {
     
      this.totalLines =  doc.total,
      this.totalCharacters = doc.characters;
      this.totalScenes = doc.scenes
      
    
    })
   }
  lines:any[]
  $script_data:Observable<any>
  ngOnInit(): void { 
 }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.

    this.dataSubscription.unsubscribe()

 }
 addTwo(arr){
  let missingTwo = arr.findIndex(ind => ind.text==='2.' && ind.category=="page-number-hidden")
 return missingTwo
}
  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
    localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ""))
    this.$script_data = this.upload.postFile(this.fileToUpload)
    this.dataSubscription = 
    this.$script_data.subscribe(data=>{
     console.log(data)
      this.lines = data[0]
     if (this.addTwo(data[0]).category){
      let two = this.addTwo(data[0])
      data[0][two].category = "page-number"
     }
      
      this.upload.lineArr = data[0]
      let x = this.upload.lineArr.filter(line => line.category =="scene-header")
      console.log(this.upload.lineArr)
      this.upload.pagesArr = data[1]
      this.upload.lineCount = data[2].map(line => line.totalLines)
 
      this.router.navigate(["download"])

    })
    
 

    

}

  
}
