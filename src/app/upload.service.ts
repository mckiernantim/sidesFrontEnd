
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
  lineCount:any
  pagesArr:any;
  issues:any;
  coverSheet: any

  url:string = "https://sides3.herokuapp.com";

  // url:string = "http://localhost:8080"

 
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
  makeJSON(data){

    console.log("firing make json from service")
    
    return  this.httpClient.post(this.url+'/download', data)
  
    
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
     console.log(fileToUpload)
    const formData: FormData = new FormData();
    formData.append('script', fileToUpload, fileToUpload.name);
    console.log(formData)
    return this.httpClient
      .post(this.url+"/api", formData, this.httpOptions )
      .pipe(map
        (data =>{
          return data
        }))
  }
     
        
  generatePdf(sceneArr,name,layout){
   
  sceneArr.push(name);
  
  let title = sceneArr[sceneArr.length-1] 
  sceneArr.pop()
  sceneArr.unshift(title)


  sceneArr[sceneArr.length-1].push(this.pagesArr[this.pagesArr.length-1].page)
  sceneArr.push(layout)
  console.log("calling generatePDF")
  console.log(sceneArr[sceneArr.length-1])
  return  this.httpClient.post(this.url+"/pdf", sceneArr )
}

lsls
postCallSheet(fileToUpload: File):Observable<any>{
  this.resetHttpOptions()
  console.log(fileToUpload.name)
  const formData: FormData = new FormData();
  this.coverSheet = fileToUpload
  formData.append('callSheet', fileToUpload, fileToUpload.name);

  return this.httpClient.post(this.url+"/callsheet", formData, this.httpOptions)
  
}




}

  


