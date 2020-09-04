
import { Injectable } from '@angular/core';
import { Observable } from "rxjs"
import { catchError, map } from 'rxjs/operators';  
import { HttpClientModule, HttpClient, HttpHeaders, HttpParams} from "@angular/common/http"
import { response } from 'express';
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  script: string 
   httpOptions = {
  headers:null,
  params:null,
  responseType:null 
  };
  lineArr: any;
  pagesArr:any;
  issues:any;
//   THIS NEEDS TO BE UN COMMENTED AND ADDED BEFORE ALL THE URL TARGETS IN THE GET METHODS
  url: string = "https://sides3.herokuapp.com"

 
  constructor(public httpClient:HttpClient) { }
  getPDF(name){
    let params = new HttpParams();
    params.append("name", name)
    this.httpOptions.params = params
    this.httpOptions.headers=new Headers();
    this.httpOptions.responseType = "blob"
    return this.httpClient.get( this.url+"/complete", {responseType:"blob", params:{name:this.script}})
}
  getFile(name){
    let params = new HttpParams();
    params.append("name", name)
    this.httpOptions.params = params
    this.httpOptions.headers =new Headers();
    this.httpOptions.responseType = "blob"

    // console.log(name)
    // headers.append('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return this.httpClient.get(this.url+ '/download', {responseType: "blob", params:{name:this.script}})
  } 
resetHttpOptions(){
    this.httpOptions = {
      headers:"",
      params:null,
      responseType:null
    }
  }
  // get classified data 
postFile(fileToUpload: File): Observable<any> {
 
  this.resetHttpOptions()
  this.script = localStorage.getItem('name')
  const endpoint ='/api';
    const formData: FormData = new FormData();
    formData.append('script', fileToUpload, fileToUpload.name);
    return this.httpClient
      .post(this.url+"/api", formData, this.httpOptions )
      .pipe(map
        (data =>{
          return data
        }))}
        
  generatePdf(sceneArr, name){
  console.log("calling generatePDF")
  sceneArr.push(name)
// change this to just refrence the page breaks and then add x out to all other lines

  // let document= []
  // document.push(name)
  // sceneArr.forEach(pageArr => {
  //   for (let i = 0; i < pageArr.length-1; i++){
  //     document.push(this.lineArr[pageArr[i].index])
  // }
  // })
 console.log(sceneArr)
  return  this.httpClient.post(this.url+"/pdf", sceneArr)
}

}

  


