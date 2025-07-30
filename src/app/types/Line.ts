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
  barY?:number|string,
  cont?:string,
  endY?:number,
  hideEnd?:string,
  lastLine?:number,

  trueScene?:string,
  hideCont?:string,
    watermarkText?:string,
  watermarkData?: {
    actorName: string;
    timestamp: string;
    pattern: string;
    fullText: string;
    isActive: boolean;
  },
  draftColorText?:string
  pageNumberText?:string,
  calculatedLeft?:string | number
  calculatedBarY?:string|number,
  calculatedXpos?:any
  calculatedYpos?:any
  calculatedEnd?: string | number
  hidden?:"hidden" | null;
  
  // Add these properties for multiple selection
  multipleSelected?: boolean;
  selectedCount?: number;

  // Add these properties for drag operations
  _originalPosition?: {
    x: string;
    y: string;
  };
  _originalText?: string;

  // Add these properties for bar text customization
  customStartText?: string;
  customEndText?: string;
  customContinueText?: string;
  customContinueTopText?: string;
  
  // Add these properties for bar text positioning
  startTextOffset?: number;
  endTextOffset?: number;
  continueTextOffset?: number;
  continueTopTextOffset?: number;

  // Add document-wide indexing properties
  docPageIndex?: number;
  docPageLineIndex?: number;

}
