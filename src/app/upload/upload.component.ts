import { AngularFirestore } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UploadService } from '../upload.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnInit, OnDestroy {
  fileToUpload: File;
  funData: Observable<any>;
  feedback: Observable<any>;
  totalTickets: Subscription;
  totalLines: Subscription;
  totalScenes: Subscription;
  totalCharacters: Subscription;
  dataSubscription: Subscription;
  working: boolean;
  displayData: {
    lines:number,
    characters:number,
    scenes:number
  }

  constructor(
    public db: AngularFirestore,
    public upload: UploadService,
    public router: Router
  ) {
    this.db = db;
    this.funData = this.upload.funData;
    this.feedback = this.upload.feedback;
    this.totalLines;
    this.funData.subscribe((doc) => {
      
      
       
    });
    this.feedback.subscribe((doc) => {
      console.log(doc);
    });
  }
  lines: any[];
  $script_data: Observable<any>;
  ngOnInit(): void {
    this.working = false;
    console.log(this.feedback);
    console.log(this.funData);
    console.log(this.totalLines, this.totalScenes, this.totalTickets);
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    // this.dataSubscription.unsubscribe()
  }
  addTwo(arr) {
    let missingTwo = arr.findIndex(
      (ind) => ind.text === '2.' && ind.category == 'page-number-hidden'
    );
    return missingTwo;
  }
  handleFileInput(files: FileList) {
    console.log('firing over script');
    this.working = true;
    this.fileToUpload = files.item(0);
    localStorage.setItem('name', this.fileToUpload.name.replace(/.pdf/, ''));
    // upload our script
    this.$script_data = this.upload.postFile(this.fileToUpload);
    this.dataSubscription = this.$script_data.subscribe((data) => {
      this.lines = data[0];
      if (this.addTwo(data[0]).category) {
        let two = this.addTwo(data[0]);
        data[0][two].category = 'page-number';
      }
      this.upload.lineArr = data[0];
      this.upload.pagesArr = data[1];
      this.upload.lineCount = [];
      data[1].forEach((page) => {
        this.upload.lineCount.push(page.filter((item) => item.totalLines));
      });
      alert(
        'your IP is safe. ' + data[3] + ' was just deleted from our servers.'
      );
      data.pop();
      this.router.navigate(['download']);
    });
  }
}
