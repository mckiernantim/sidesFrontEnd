import { text } from 'body-parser/lib/types/text';
import { Component, OnInit, Inject, AfterViewInit } from '@angular/core';
import { UploadService } from '../upload.service';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';


@Component({
  selector: 'app-issue',
  templateUrl: './issue.component.html',
  styleUrls: ['./issue.component.css']
})
export class IssueComponent implements OnInit, AfterViewInit {
scriptData: any[];
problems:any[];
selected:any[];
modalProblems:any[]=[];
currentProblem:any;
problemIndex:number=0
lineInQuestion:string;
modalReady:boolean = false
  constructor(public  upload:UploadService,     
    public dialogRef: MatDialogRef<IssueComponent>,  
    @Inject(MAT_DIALOG_DATA) public data:any) { }

  ngOnInit(): void {
    
  }
  ngAfterViewInit(): void {
    

  
    this.scriptData = this.upload.lineArr
  
    // scenes that have problem lines
    this.problems = this.data.scenes
    console.log(this.problems)

    this.selected =this.data.selected
    console.log(this.selected)
    
    this.getProblems()
    this.updateProblem()

    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    
  }
  getProblems(){
    for(let i = 0; i < this.selected.length; i++){

      let scenes = this.problems.filter(scene => scene.sceneNumber === this.selected[i].sceneIndex +1)
       console.log(scenes)
       scenes.forEach(scene =>{
       scene.lineCSS =[];
        for(let i = 0 ; i <scene.text.length; i++){
           scene.lineCSS.push(this.scriptData[scene.lastCharIndex+i].category)
        }
       })
       this.modalProblems.push(scenes)
    }
    console.log(this.modalProblems)
    console.log("PROBLEMS FROM MODAL")
    this.modalProblems = this.modalProblems.flat();
    this.modalReady=true

  }
  updateProblem(){
    this.currentProblem = this.modalProblems[this.problemIndex];
    console.log(this.currentProblem)
    console.log(this.problemIndex)
    console.log(this.modalProblems)
    this.currentProblem.modalText= [];
    for(let i=0;i<this.currentProblem.lineCSS.length;i++){
   
      this.currentProblem.modalText.push({
        text:this.currentProblem.text[i],
        css:this.currentProblem.lineCSS[i]
      })
   }
   this.currentProblem.finalText ={
    css:this.currentProblem.modalText[this.currentProblem.modalText.length-1].css + " last-line",
    text:this.currentProblem.modalText[this.currentProblem.modalText.length-1].text
   }

  this.currentProblem.modalText.pop()
    
    
  }
  iterateProblem(){

    if(this.problemIndex+1 < this.modalProblems.length){
    this.problemIndex+=1;
    this.updateProblem()
    }else 
    this.dialogRef.close()
  }
  updateScriptDoc(index, str){
   
    this.upload.lineArr[index].category=str;
    this.iterateProblem()
  }
  getClass(str){
    return str
}

}
