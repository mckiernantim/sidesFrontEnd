export interface Line {
  belongsTo?:number,
  category: string,
  subCategory?: string,
  class:string ,
  code?:number,
  index: number,
  lastCharIndex?:number,
  multipleColumn: boolean,
  page: number,
  pageNumber?:number,
  sceneNumber?:string,
  sceneIndex:number,
  sceneNumberText?:string,
  text: string,
  // cass values
  visible?:string, // string value to pass to css file
  yPos: number,
  xPos: number,
  // display or hide `end` bar
  end?:string,
  // display or hide continue bar
  bar?:string,
  finalLineOfScript?:boolean,
  barY?:number,
  cont?:string,
  endY?:number,
  hideEnd?:string,
  lastLine?:number,

  trueScene?:string,
  hideCont?:string,
  watermarkText?:string,
  draftColorText?:string
  pageNumberText?:string,
  calculatedLeft?:string | number
  calculatedBarY?:string|number,
  calculatedXpos?:any
  calculatedYpos?:any
  calculatedEnd?:string | number
  hidden?:"hidden" | null;
  
  
}
