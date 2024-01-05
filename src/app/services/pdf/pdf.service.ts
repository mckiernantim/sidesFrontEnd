import { Injectable } from '@angular/core';
import { UploadService } from '../upload/upload.service';
// Import other dependencies if required

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  conditions = [
    'dialog',
    'character',
    'description',
    'first-description',
    'scene-header',
    'short-dialog',
    'parenthetical',
    'more',
    'shot',
    'delete',
  ];
  finalPdfData: any; // Adjust the type according to your data structure
  callsheet: string;
  selected: any[]; // Specify the type if known, e.g., SelectedItem[]
  watermark: string;
  script: string; // Presumably the name of the script or relevant data // Total number of pages in the PDF
  finalDocument: any; // Adjust the type to match your document structure
  initialFinalDocState: any; // Type this according to your initial document state
  scriptData:any[] 
  totalPages:any[] 
  finalDocReady:boolean = false;
// 1/5 WE NEED TO MOVE THIS SO THAT THIS FIRES EVERY TIME THE USER NAVIGATES TO UPLOAD COMPONENT
  constructor(public upload:UploadService) {
    // Initialize your properties if needed
    this.finalDocument = {
      doc: {},
      breaks: {},
    };
    this.initializeData();
    // Inject other services if required
  }

  private initializeData() {
    debugger
    this.scriptData = this.upload.lineArr;
    this.totalPages = this.upload.pagesArr || null;

    if (this.scriptData) {
      this.initializeCharactersAndScenes();
    }
  }

  private initializeCharactersAndScenes() {
    // Logic to initialize characters and scenes
  }
  makeVisible(sceneArr, breaks) {
    // loop through and find breaks
    this.finalDocument.breaks = breaks;
    breaks = breaks.sort((a, b) => a.first - b.first);
    // merge all pages to one array
    let merged = [].concat.apply([], sceneArr);
    let counter = 0;
    const skippedCategories = ['page-number', 'injected-break'];
    // find scene breaks and ENDS
    for (let i = 0; i < merged.length; i++) {
      let lineToMakeVisible = merged[i];
      let currentSceneBreak = breaks[counter] || 'last';

      if (
        // see if our line falls between the first and last from our breaks
        currentSceneBreak &&
        lineToMakeVisible.index > currentSceneBreak.first &&
        lineToMakeVisible.index <= currentSceneBreak.last
      ) {
        lineToMakeVisible.visible = 'true';
        // add START bar to scene headers - only Scene Headers have the BAR attriubte
        if (lineToMakeVisible.bar === 'noBar') {
          lineToMakeVisible.bar = 'bar';
        }
        // IF OUR LINE HAS A LAST LINE ATTRIBUTE THAT MEANS ITS A SCENE HEADER
        // IF IT IS VISIBLE WELL THEN WE NEED TO MAKE SURE THE LAST LINE IS VISIBLE TOO
        if (
          lineToMakeVisible.lastLine &&
          !lineToMakeVisible.finalScene &&
          lineToMakeVisible.visible === 'true'
        ) {
          //immedaitely check for last line
          //grab the last line of our scene from the header
          let finalTrueLine = merged.find(
            (line) => line.index === lineToMakeVisible.lastLine
          );
          // if finalTrueLine is a page number we need to fix
          if (finalTrueLine.category.match('page-number')) {
            // loop forward after final line in scene is found.  Find a SCENE-HEADER
            for (
              let finalTrue = merged.indexOf(finalTrueLine);
              finalTrue < merged.length;
              finalTrue++
            ) {
              if (!breaks[counter]) break;
              if (
                //if the line AFTER our final True line of the scene is a scene header we are good to go
                // for making an END
                // we need to continue to loop forward and find the end of the page in the event we end on a hidden page number
                merged[finalTrue + 1] &&
                merged[finalTrue + 1].category === 'scene-header'
              ) {
                merged[finalTrue].end = 'END';
                counter += 1;
                break;
              }
              // if we come to the end of the page
              // we need to iterate backwards to find the real final line
              else {
                for (let j = finalTrue - 1; j > 0; j--) {
                  if (
                    merged[j].category &&
                    !merged[j].category.match('page-number')
                  ) {
                    merged[j].end = 'END';
                    counter += 1;
                    break;
                  }
                }
              }
            }
          } else {
            finalTrueLine.end = 'END';
          }
        }
        if (merged[i].index === currentSceneBreak.last) {
          counter += 1;
        }
        if (lineToMakeVisible.finalScene) {
          let actualLastLine;
          for (let k = 1; k < merged.length; k++) {
            let lineToCheck = merged[merged.length - k];
            if (!skippedCategories.includes(lineToCheck.category)) {
              lineToCheck.end = 'END';
              lineToCheck.barY = lineToCheck.yPos;
              lineToCheck.finalLineOfScript = true;
              actualLastLine = merged.length - k;
              break;
            }
          }
          for (
            let m = merged.indexOf(lineToMakeVisible);
            m < actualLastLine;
            m++
          ) {
            merged[m].visible = 'true';
            merged[m].cont = 'hideCont';
          }
        }
      } else if (!currentSceneBreak) {
        break;
      }
    }

    merged.forEach((item) => {
      if (
        item.category === 'page-number-hidden' ||
        item.category === 'page-number'
      ) {
        item.visible = 'true';
        (item.cont = 'hideCont'), (item.end = 'hideEnd');
        item.xPos = 87;
      }
      if (item.category === 'injected-break') {
        item.visible = 'false';
      }
    });
    return merged;
  }
  
  getPdf(sceneArr, name, numPages, callSheetPath = 'no callsheet') {
    sceneArr = this.sortByNum(sceneArr);
    let fullPages = [];
    let used = [];
    let pages = [];
    let sceneBreaks = [];
    // FIND SCENE BREAKS FIRST AND RECORD PAGES THAT ARE NEEDED IN pages ARRAY
    sceneArr.forEach((scene) => {
      for (let i = scene.page; i <= scene.lastPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      // RECORD SCENE BREAKS FOR TRUE AND FALSE VALUES LATER
      // not getting firstLine for all scenes for some reason
      let breaks = {
        first: scene.firstLine,
        last: scene.lastLine,
        scene: scene.sceneNumber,
        firstPage: scene.page,
      };

      sceneBreaks.push(breaks);
    });
    // GET ONLY PROPER PAGES FROM TOTAL SCRIPT
    pages.forEach((page) => {
      let doc = this.scriptData.filter((scene) => scene.page === page);
      //  BEGIN THE CLASSIFYING FOR TEMPLATE
      // add a SCENE BREAK LINE
      doc.push({
        page: page,
        bar: 'noBar',
        hideCont: 'hideCont',
        hideEnd: 'hideEnd',
        yPos: 50,
        category: 'injected-break',
        visible: 'true',
      });
      fullPages.push(doc);
    });
    //  SORT FULL PAGES
    fullPages = fullPages.sort((a, b) => (a[0].page > b[0].page ? 1 : -1));
    // MAKE THE LINES VISIBLE
    let final = this.makeVisible(fullPages, sceneBreaks);
    if (numPages.length > 1) {
      let lastPage = numPages[numPages.length - 1];
      final.push(lastPage);
    } // CROSS OUT PROPER LINES
    // CREATE OBJECT FOR FINAL
    let finalDocument = {
      data: [],
      name: name,
      numPages: numPages.length,
      callSheetPath: callSheetPath,
    };

    let page = [];
    //FINAL IS OUR ASSEMBLED SIDES DOCUMENT WITH TRUE AND FALSE VALUES
    for (let i = 0; i < final.length; i++) {
      //  if the target has NO text and isnt to be skipped
      // lines are insterted to deliniate page breaks and satisfy below conditional;
      if (final[i].page && !final[i].text && !final[i].skip) {
        finalDocument.data.push(page);
        page = [];
      } else {
        page.push(final[i]);
      }
    }
    // CONTINUE ARROWS
  
    // LOOP FOR PAGES
    for (let i = 0; i < finalDocument.data.length; i++) {
      // ESTABLISH FIRST AND LAST FOR CONT ARROWS
      let currentPage = finalDocument.data[i];
      let nextPage = finalDocument.data[i + 1] || null;
      let first,
        last,
        nextPageFirst = undefined;
      if (nextPage) nextPageFirst = nextPage[0];
      // loop and find the next page first actual line and check it's not page number
      for (let j = 0; j < 5; j++) {
        if (finalDocument.data[i + 1]) {
          let lineToCheck = finalDocument.data[i + 1][j];
          if (this.conditions.includes(lineToCheck.category)) {
            nextPageFirst = finalDocument.data[i + 1][j];
            break;
          }
        }
      }
      // LOOP FOR LINES
      for (let j = 0; j < currentPage.length; j++) {
        let lastLineChecked = currentPage[currentPage.length - j - 1];
        let currentLine = finalDocument.data[i][j];
        currentLine.end === 'END'
          ? (currentLine.endY = currentLine.yPos - 5)
          : currentLine;
        // get first and last lines of each page
        // to make continute bars
        if (
          currentPage &&
          //check last category
          this.conditions.includes(lastLineChecked.category) &&
          !last
        ) {
          last = lastLineChecked;
        }
        if (
          (nextPage &&
            nextPage[j] &&
            !first &&
            this.conditions.includes(nextPage[j].category)) ||
          i === finalDocument.data.length - 1
        ) {
          first = currentPage[j];
        }
        if (first && last) {
          if (
            first.visible === 'true' &&
            last.visible === 'true' &&
            first.category != 'scene-header'
          ) {
            first.cont = 'CONTINUE-TOP';
            last.finalLineOfScript
              ? (last.cont = 'hideCont')
              : (last.cont = 'CONTINUE');
            first.barY = first.yPos + 10;
            last.barY = 55;
          }
          // conditional to ADD CONTINUE BAR if scene continues BUT first line of page is false
          else if (
            nextPageFirst &&
            nextPageFirst.visible === 'true' &&
            last.visible === 'true'
          ) {
            last.cont = 'CONTINUE';
            last.barY = 55;
          }
          break;
        }
      }
    }
    this.initialFinalDocState = { ...finalDocument.data };
    this.finalDocument.doc = finalDocument;

    // finalDocument = this.lineOut.makeX(finalDocument)
    if (this.watermark) {
      this.waterMarkPages(this.watermark, finalDocument.data);
    }
    console.log(this.finalDocument);
    this.finalDocument = finalDocument;
    this.finalDocReady = true;
    return finalDocument;
  }

  sendFinalDocumentToServer(finalDocument) {
    // Implementation of sendFinalDocumentToServer
    // Adjust the implementation to fit the service context
  }

  sortByNum(array) {
    return array.sort((a, b) => {
      let x = a.sceneNumber;
      let y = b.sceneNumber;

      return x < y ? -1 : x > y ? 1 : 0;
    });
  }

  waterMarkPages(watermark, doc) {
    doc.forEach((page) => {
      page[0].watermarkText = watermark;
    });
  }

  makePages(scenes) {
    let pageNums = scenes.map((scene) => scene.page).sort((a, b) => a - b);
    return pageNums;
  }

  // Other methods as needed...
}
