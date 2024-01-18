import { Injectable } from '@angular/core';
import { UploadService } from '../upload/upload.service';
import { skip } from 'rxjs/operators';
import { debug } from 'console';
/*  
  THIS SHOULD BE ITS OWN 4 OR 5 SERVICES ALL IMPORTED INTO THE PARENT SERVICE OF PDF 
  PERHAPPS LINE-SERVICE, SCENE-SERVICE, DOCUMENT-SERVICE ETC  
*/

@Injectable({
  providedIn: 'root',
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
  scriptData: any[];
  totalPages: any[];
  finalDocReady: boolean = false;
  scenes: any[];
  initialSelection: any[] = [];
  pages: any[];
  // DOCUMENT OPTIONS
  characters: any;
  charactersCount: number;
  scenesCount: number;
  textToTest: string[];
  modalData: any[];
  selectedOB: any;
  pageLengths: any[];
  length: number;
  callSheetPath: string;
  scriptLength: number;
  date: number;
  totalLines: any;
  // 1/5 WE NEED TO MOVE THIS SO THAT THIS FIRES EVERY TIME THE USER NAVIGATES TO UPLOAD COMPONENT
  constructor(public upload: UploadService) {
    // Initialize your properties if needed
    this.initializeData();
    // Inject other services if required
  }

  resetData() {
    this.initializeData();
  }
  initializeData() {
    this.scriptData = this.upload.lineArr;
    this.totalPages = this.upload.pagesArr || null;
    if (this.scriptData) {
      this.initializeCharactersAndScenes();
    }
  }


  private initializeCharactersAndScenes() {
    this.getCharacters();
    this.getScenes();
  }

  getCharacters() {
    if (this.scriptData) {
      // GET CHARS
      this.characters = this.scriptData.filter((line) => {
        return line.category === 'character';
      });
      this.characters = [
        ...new Set(this.characters.map((line) => line.text.replace(/\s/g, ''))),
      ];
    }
  }
  getScenes() {
    if (this.totalPages && this.scriptData) {
      this.scenes = this.scriptData.filter((line) => {
        return line.category === 'scene-header';
      });
      for (let i = 0; i < this.scenes.length; i++) {
        // give scenes extra data for later
        this.setLastLines(i);
        // POPULATE TABLE
      }
    }

    this.length = this.scriptData.length || 0;
    // assign PAGENUMBER values to page 0 and 1 in order for future
    for (let i = 0; i < 200; i++) {
      this.scriptData[i].page == 0
        ? (this.scriptData[i].pageNumber = 0)
        : this.scriptData[i].page == 1
        ? (this.scriptData[i].pageNumber = 1)
        : this.scriptData;
    }
  }

  setLinesInSceneToVisible(sceneArr, breaks) {
    // combine the complete scenes
    let merged = this.flattenScenes(sceneArr);
    // sort the scene breaks for good measure 
    let sortedBreaks = this.sortBreaks(breaks);
    // process ALL THE FUCKING DATA
    return this.processLines(merged, sortedBreaks);
  }

  flattenScenes(sceneArr) {
    return sceneArr.reduce((acc, scene) => acc.concat(scene), []);
  }

  sortBreaks(breaks) {
    return breaks.sort((a, b) => a.first - b.first);
  }

  processLines(merged, breaks) {
    // start with a zeroed index for the currentSceneBreak
    let currentBreakIndex = 0;
    // get the first scene break - where the scene ends
      // this data arrives from the server
    let currentSceneBreak = breaks[currentBreakIndex];
    for (let index = 0; index < merged.length; index++) {
      const line = merged[index];
      if (this.isLineInCurrentBreak(line, currentSceneBreak)) {
          // flag this as string true - this is done for CSS parsing at the end
          line.visible = 'true';
          this.handleSpecialCases(line, merged, index, breaks, currentBreakIndex);
      }
  
      // Move to the next scene break if needed
      if (line.index === currentSceneBreak.last) {
          currentBreakIndex++;
          currentSceneBreak = breaks[currentBreakIndex];
          if (!currentSceneBreak) {
              break; // Exit the loop when there are no more scene breaks
          }
      }
  }
    
    return merged;
  }

  isLineInCurrentBreak(line, currentSceneBreak) {
    // edge case for the last scene in the doc - inserted before we got here
    if (currentSceneBreak === 'last') {
      return true;
    }
    
    // return bool value to see if our line falls within bounds
    return (
      line.index > currentSceneBreak.first &&
      line.index <= currentSceneBreak.last
    );
  }
 
  handleSpecialCases(line, merged, index, breaks, currentBreakIndex) {
    // check if our line is true, is a scene hader, and doesn't have a BAR value already
    if (line.category === 'scene-header' && line.bar !== 'bar' && line.visible === "true") {
      // flags line to show a START bar
      line.bar = 'bar';
    }

    // handle last lines in scenes-  this is flagged in the scan
    if (line.lastLine) {
      this.handleLastLineOfScene(line, merged, index);
    }

    // Special Handling for the Final Scene
    if (line.finalScene) {
      this.handleFinalScene(line, merged);
    }
  }

  handleLastLineOfScene(line, merged, index) {
    let lastLineIndex = line.lastLine;
    let lastLine = merged.find(l => l.index === lastLineIndex);
    let sceneNumberText = "";
    if (lastLine && lastLine.category === 'page-number') {
        for (let i = index - 1; i >= 0; i--) {
            if (!merged[i].category.match('page-number')) {
                merged[i].end = 'END';
                merged[i].barY = merged[i].yPos;
             
                merged[i].sceneNumberText = line.sceneNumberText
                break;
            }
        }
    } else if (lastLine) {
        lastLine.end = 'END';
        lastLine.barY = lastLine.yPos;
        lastLine.sceneNumberText = line.sceneNumberText;
    }
}

handleFinalScene(line, merged) {
    const skippedCategories = ['page-number', 'injected-break', 'page-number-hidden'];
    let actualLastLineIndex = merged.length - 1;

    while (skippedCategories.includes(merged[actualLastLineIndex].category) && actualLastLineIndex >= 0) {
        actualLastLineIndex--;
    }

    for (let i = merged.indexOf(line); i <= actualLastLineIndex; i++) {
        merged[i].visible = 'true';
        merged[i].cont = 'hideCont';
        if (i === actualLastLineIndex) {
            merged[i].end = 'END';
            merged[i].barY = merged[i].yPos;
            merged[i].finalLineOfScript = true;
            merged[i].sceneNumberText = this.findSceneNumberText(merged, merged[i]);
        }
    }
}

findSceneNumberText(page, line) {
  // Find the index of the current line
  const currentLineIndex = page.indexOf(line);

  // Iterate backwards from the current line to find the scene header
  for (let i = currentLineIndex; i >= 0; i--) {
    if (page[i].category === 'scene-header' && page[i].scene === line.scene) {
      // Return the scene number text if found
      return page[i].sceneNumberText;
    }
  }

  // Return null if no scene header is found
  return null;
}
  makeVisible(sceneArr, breaks) {
    // loop through and find breaks
    this.finalDocument.breaks = breaks;
    breaks = breaks.sort((a, b) => a.first - b.first);
    // merge all pages to one array
    let merged = [].concat.apply([], sceneArr);
    let counter = 0;
    const skippedCategories = [
      'page-number',
      'injected-break',
      'page-number-hidden',
    ];
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
        if (lineToMakeVisible.bar != 'bar') {
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

    merged.forEach((line) => {
      let currentSceneNum = null;
      if (line.category === 'scene-header')
        currentSceneNum = line.sceneNumberText;
      if (
        line.category === 'page-number-hidden' ||
        line.category === 'page-number'
      ) {
        line.visible = 'true';
        (line.cont = 'hideCont'), (line.end = 'hideEnd');
        line.xPos = 87;
      }
      if (line.category === 'injected-break') {
        line.visible = 'false';
      }
      if (!line.end) line.end = 'hideEnd';
      if (!line.bar) line.bar = 'hideBar';
      if (!line.cont) line.bar = 'hideCont';
      if (!line.sceneNumber) {
        line.sceneNumber = currentSceneNum;
      }
    });
    return merged;
  }


  initializePdfDocument(name, numPages, callSheetPath) {
    this.finalDocument = {
      name: name,
      numPages: numPages,
      callSheetPath: callSheetPath,
      data: [], // An array to hold PDF data, structured as needed
    };
  }

  processPdf(sceneArr, name, numPages, callSheetPath = 'no callsheet') {
    sceneArr = this.sortByNum(sceneArr);
    this.initializePdfDocument(name, numPages, callSheetPath)
    let pages = this.collectPageNumbers(sceneArr);
    let sceneBreaks = this.recordSceneBreaks(sceneArr);
    
    let fullPages = this.constructFullPages(pages);
 // Set lines in scenes to visible
   let processedLines = this.setLinesInSceneToVisible(fullPages, sceneBreaks);

 // Build final pages based on 'page-number'
   let linesAsPages:any[] = this.buildFinalPages(processedLines);

 // Mark 'CONTINUE' and 'CONTINUE-TOP' where needed
    this.assignContinueMarkersToScenes(linesAsPages)


 // Mark 'END' for the last lines of scenes
 this.markEndLines(linesAsPages, sceneBreaks);
    this.finalDocument.data = linesAsPages;
    this.finalDocReady = true;
    // You can now use sceneBreaks and fullPages as needed
    return
  }

  collectPageNumbers(sceneArr) {
    let pages = [];
    sceneArr.forEach((scene) => {
      for (let i = scene.page; i <= scene.lastPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
    });
    return pages;
  }

  recordSceneBreaks(sceneArr) {
    return sceneArr.map(scene => ({
        first: scene.firstLine,
        last: scene.lastLine,
        scene: scene.sceneNumber,
        firstPage: scene.page
    }));
}

  constructFullPages(pages) {
    return pages.map(page => {
        let doc = this.scriptData.filter(scene => scene.page === page);
        doc.push({
            page: page,
            bar: 'noBar',
            hideCont: 'hideCont',
            hideEnd: 'hideEnd',
            yPos: 50,
            category: 'injected-break',
            visible: 'true'
        });
        return doc;
    });
}

buildFinalPages(processedLines) {
  let finalPages = {};
  processedLines.forEach(line => {
    // Initialize an array for each page number
    if (!finalPages[line.page]) {
      finalPages[line.page] = [];
    }
    // Add the line to the corresponding page
    finalPages[line.page].push(line);
  });

  // Convert the object into an array of pages
  return Object.values(finalPages);
}
markEndLines(processedLines, breaks) {
  breaks.forEach(breakInfo => {
    // Find the last line of the current scene
    const lastLineOfScene = processedLines.find(line => line.index === breakInfo.last);
    
    // Mark the last line with 'END'
    if (lastLineOfScene) {
      lastLineOfScene.end = 'END';
    }
  });

  return processedLines;
}
assignContinueMarkersToScenes(documentPages) {
  // Get a list of all visible scenes
  const visibleScenes = documentPages.flatMap(page => 
    page.filter(line => line.category === 'scene-header' && line.visible === 'true')
  );

  visibleScenes.forEach(scene => {
    let foundSceneStart = false;

    // Iterate through each page
    for (let i = 0; i < documentPages.length; i++) {
      const page = documentPages[i];
      let foundContinueLine = false;

      // Iterate through each line in the page
      for (let j = 0; j < page.length; j++) {
        const line = page[j];

        // Skip irrelevant categories
        if (['injected-break', 'page-number', 'page-number-hidden'].includes(line.category)) {
          continue;
        }

        // Marking the start of the scene
        if (line.scene === scene.sceneNumber && line.category === 'scene-header') {
          foundSceneStart = true;
        }

        // If this is the last content line of the page and belongs to the scene
        if (j === page.length - 1 && line.visible === 'true' && foundSceneStart) {
          line.cont = 'CONTINUE';
          line.sceneNumberText = scene.sceneNumberText;
          foundContinueLine = true;
        }
      }

      // Handle CONTINUE-TOP for the next page if the scene is continued
      if (foundContinueLine && i < documentPages.length - 1) {
        const nextPage = documentPages[i + 1];
        for (const nextLine of nextPage) {
          if (!['injected-break', 'page-number', 'page-number-hidden'].includes(nextLine.category)) {
            nextLine.cont = 'CONTINUE-TOP';
            nextLine.sceneNumberText = scene.sceneNumberText;
            break; // Break after setting the first relevant line
          }
        }
      }

      // Reset for the next scene
      if (!foundContinueLine) {
        foundSceneStart = false;
      }
    }
  });
}


addSceneNumberText(line, allLines) {
  // Iterate backwards from the current line to find the last scene header of the same scene
  for (let i = allLines.indexOf(line); i >= 0; i--) {
    if (allLines[i].category === 'scene-header' && allLines[i].scene === line.scene) {
      line.sceneNumberText = allLines[i].sceneNumberText;
      break;
    }
  }
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
    }
    // CROSS OUT PROPER LINES
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
          if (this.conditions.includes(lineToCheck?.category)) {
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
      this.watermarkPages(this.watermark, finalDocument.data);
    }
    
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

  watermarkPages(watermark, doc) {
    doc.forEach((page) => {
      page[0].watermarkText = watermark;
    });
  }

  makePages(scenes) {
    let pageNums = scenes.map((scene) => scene.page).sort((a, b) => a - b);
    return pageNums;
  }

  setLastLines(i) {
    let last;
    let currentScene = this.scenes[i];
    let sceneInd;
    let next = this.scenes[i + 1];
    if (next || i === this.scenes.length - 1) {
      if (next) {
        last = next.index;
        sceneInd = currentScene.sceneIndex;
        currentScene.index === 0
          ? (currentScene.firstLine = 0)
          : (currentScene.firstLine =
              this.scriptData[currentScene.index - 1].index);
        currentScene.preview = this.getPreview(i);
        currentScene.lastPage = this.getLastPage(currentScene);
      } else {
        // get first and last lines for last scenes
        last =
          this.scriptData[this.scriptData.length - 1].index ||
          this.scriptData.length - 1;
        currentScene.firstLine = this.scriptData[currentScene.index - 1].index;
        currentScene.lastLine = last;
        currentScene.lastPage = this.getLastPage(currentScene);
        currentScene.preview = this.getPreview(i);
      }
    }
  }

  getLastPage = (scene) => {
    return this.scriptData[scene.lastLine].page || null;
  };

  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.scriptData[this.scenes[ind].index + 1].text +
      ' ' +
      this.scriptData[this.scenes[ind].index + 2].text)
      ? this.scriptData[this.scenes[ind].index + 2].text
      : ' ';
  }
  // Other methods as needed...
}
