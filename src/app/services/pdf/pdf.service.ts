import { Injectable } from '@angular/core';
import { UploadService } from '../upload/upload.service';
import { skip } from 'rxjs/operators';
import { LINE_TYPES} from '../../types/LineTypes'
import * as scriptData from '../../testingData/pdfServiceData/mockScriptData.json';

/*  
  THIS SHOULD BE ITS OWN 4 OR 5 SERVICES ALL IMPORTED INTO THE PARENT SERVICE OF PDF 
  PERHAPPS LINE-SERVICE, SCENE-SERVICE, DOCUMENT-SERVICE ETC  
*/
import { Line } from 'src/app/types/Line';

@Injectable({
  providedIn: 'root',
})

export class PdfService {
  // remove the first option as we dont want scene headers in our data
  conditions = [, ...LINE_TYPES];
  finalPdfData: any; 
  callsheet: string;
  selected: any[]; 
  watermark: string;
  script: string; 
  finalDocument: any; 
  initialFinalDocState: any; 
  allLines: any[];
  firstAndLastLinesOfScene:any[];
  individualPages: any[];
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
    this.initializeData();
  }

  resetData() {
    this.initializeData();
  }
  initializeData() {
    if (this.upload.allLines) {
      this.allLines = this.upload.allLines;
      this.firstAndLastLinesOfScene = this.upload.firstAndLastLinesOfScenes
      this.individualPages = this.upload.individualPages || null;
      if (this.allLines) {
        this.initializeCharactersAndScenes();
      }
    } else {
      this.allLines = scriptData;
      console.log(this.allLines[0])
    }
  }

  private initializeCharactersAndScenes() {
    
    this.getCharacters();
    this.getScenes();
  }

  getCharacters() {
    if (this.allLines) {
      // GET CHARS
      this.characters = this.allLines.filter((line) => {
        return line.category === 'character';
      });
      this.characters = [
        ...new Set(this.characters.map((line) => line.text.replace(/\s/g, ''))),
      ];
    }
  }
  getScenes() {
    if (this.individualPages && this.allLines) {
      this.scenes = this.allLines.filter((line) => {
        return line.category === 'scene-header';
      });
      for (let i = 0; i < this.scenes.length; i++) {
        let sceneRefInTable = this.scenes[i];
        let sceneInActualScript = this.allLines[sceneRefInTable.index];
        // give scenes extra data for later
        this.setLastLines(i);

        this.processSceneHeader(sceneRefInTable, sceneInActualScript);
        
      }
    }

    this.length = this.allLines.length || 0;
    // assign PAGENUMBER values to page 0 and 1 in order for future
    for (let i = 0; i < 200; i++) {
      this.allLines[i].page == 0
        ? (this.allLines[i].pageNumber = 0)
        : this.allLines[i].page == 1
        ? (this.allLines[i].pageNumber = 1)
        : this.allLines;
    }
  }

  setLinesInSceneToVisible(sceneArr, breaks) {
    // combine the complete scenes

    let merged = this.flattenScenes(sceneArr);
    merged.forEach(el => {
      el.end = "hideEnd"
      el.cont ="hideCont"
    })
      
    // sort the scene breaks for good measure
    let sortedBreaks = this.sortBreaks(breaks);
    // process ALL THE FUCKING DATA
    return this.processLines(merged, sortedBreaks);
  }
  updatePdfState(updatedPage: Line[]) {
    // Update the PDF state with the changes
    // Assuming you have logic to update the relevant portion of the PDF state
    // For example:
    // this.pdfState.pages[this.currentPage] = updatedPage;
    // Or replace the entire page if needed

  }
  private flattenScenes(sceneArr) {
    return sceneArr.reduce((acc, scene) => acc.concat(scene), []);
  }

  private  sortBreaks(breaks) {
    return breaks.sort((a, b) => a.first - b.first);
  }
  private isLineWithinBreak(line, currentBreak) {
    return currentBreak && line.index > currentBreak.first && line.index <= currentBreak.last;
  }

  private makeLineVisible(line: any) {
    line.visible = 'true';
  }
 
  private addBarToSceneHeader(line: any) {
    if (line.bar !== 'bar') {
      line.bar = 'bar';
    }
  }
  private isSceneHeader(line: any) {
    return line.lastLine && !line.finalScene;
  }
  private handleSceneHeader(line: any, merged: any[], currentBreak: any, counter: number, breaks: any[]) {
    let finalTrueLine = merged.find((l) => l.index === line.lastLine);
    if (finalTrueLine.category.match('page-number')) {
      this.processFinalTrueLine(finalTrueLine, merged, counter, breaks);
    } else {
      finalTrueLine.end = 'END';
    }
  }
    
  private processFinalTrueLine(finalTrueLine: any, merged: any[], counter: number, breaks: any[]) {
    for (let i = merged.indexOf(finalTrueLine); i < merged.length; i++) {
      if (!breaks[counter]) break;
      if (merged[i + 1] && merged[i + 1].category === 'scene-header') {
        merged[i].end = 'END';
        counter++;
        break;
      } else {
        this.findRealFinalLine(merged, i);
      }
    }
  }
  private handleFinalScene(line, merged) {
    const skippedCategories = ['page-number', 'injected-break', 'page-number-hidden'];
    let actualLastLineIndex = merged.length - 1;
  
    while (
      skippedCategories.includes(merged[actualLastLineIndex].category) &&
      actualLastLineIndex >= 0
    ) {
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
  private makeFinalSceneVisible(line: any, merged: any[], actualLastLine: number) {
    for (let m = merged.indexOf(line); m < actualLastLine; m++) {
      merged[m].visible = 'true';
      merged[m].cont = 'hideCont';
    }
  }
  private applyFinalAttributes(merged: any[], skippedCategories: string[]) {
    merged.forEach((line) => {
      let currentSceneNum = null;
      if (line.category === 'scene-header') {
        currentSceneNum = line.sceneNumberText;
      }
      if (line.category === 'page-number') {
        line.visible = 'true';
        line.cont = 'hideCont';
        line.end = 'hideEnd';
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
  }
  
  private findRealFinalLine(merged: any[], index: number) {
    for (let j = index - 1; j > 0; j--) {
      if (merged[j].category && !merged[j].category.match('page-number')) {
        merged[j].end = 'END';
        break;
      }
    }
  }

  private isLastLineOfBreak(line: any, currentBreak: any) {
    return line.index === currentBreak.last;
  }

  private findActualLastLine(merged: any[], skippedCategories: string[]) {
    for (let k = 1; k < merged.length; k++) {
      let line = merged[merged.length - k];
      if (!skippedCategories.includes(line.category)) {
        line.end = 'END';
        line.barY = line.yPos;
        line.finalLineOfScript = true;
        return merged.length - k;
      }
    }
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
  private handleSpecialCases(line, merged, index, breaks, currentBreakIndex) {
    // Check if our line is true, is a scene header, and doesn't have a BAR value already
    if (
      line.category === 'scene-header' &&
      line.bar !== 'bar' &&
      line.visible === 'true'
    ) {
      // Flags line to show a START bar
      line.bar = 'bar';
    }
  
    // Handle last lines in scenes - this is flagged in the scan
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
    let lastLine = merged.find((l) => l.index === lastLineIndex);
    let lastLinePositionInMerged = merged.findIndex((l) => l.index === lastLineIndex);
    let sceneNumberText = '';
    if (lastLine && lastLine.category === 'page-number') {
      for (let i = lastLinePositionInMerged - 1; i >= 0; i--) {
        if (this.conditions.includes(merged[i].category)) {
          merged[i].end = 'END';
          merged[i].barY = merged[i].yPos;

          merged[i].sceneNumberText = line.sceneNumberText;
          break;
        }
      }
    } else if (lastLine) {
      lastLine.end = 'END';
      lastLine.barY = lastLine.yPos;
      lastLine.sceneNumberText = line.sceneNumberText;
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
    ;
    
    this.finalDocument.breaks = breaks;
    breaks = this.sortBreaks(breaks);
    let merged = this.flattenScenes(sceneArr);
    let counter = 0;
    const skippedCategories = ['page-number', 'injected-break', 'page-number-hidden'];
  
    for (let i = 0; i < merged.length; i++) {
      let line = merged[i];
      let currentBreak = breaks[counter] || 'last';
  
      if (this.isLineWithinBreak(line, currentBreak)) {
        this.makeLineVisible(line);
        this.addBarToSceneHeader(line);
  
        if (this.isSceneHeader(line) && line.visible === 'true') {
          this.handleSceneHeader(line, merged, currentBreak, counter, breaks);
        }
  
        if (this.isLastLineOfBreak(line, currentBreak)) {
          counter++;
        }
  
        if (line.finalScene) {
          this.handleFinalScene(line, merged);
        }
      } else if (!currentBreak) {
        break;
      }
    }
  
    this.applyFinalAttributes(merged, skippedCategories);
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

  hideExtraDraftVersionText(pages) {
    pages.forEach((page) => {
      const versionLines = page.filter((line) => line.category === 'version');
      for (let i = 1; i < versionLines.length; i++) {
        versionLines[i].hidden = 'hidden';
      }
    });
    return pages;
  }

  hideExtraPageNumberText(pages) {
    pages.forEach((page) => {
      const pageNumbers = page.filter(
        (line) => line.category === 'page-number'
      );
      for (let i = 1; i < pageNumbers.length; i++) {
        pageNumbers[i].hidden = 'hidden';
      }
    });
    
    return pages;
  }
  processPossibleDraftText(pages) {
    const options = ['page-number', 'version'];
    const dateRegex = /\(?\d{1,2}[\/\-.]\d{1,2}[\/\-.](\d{2}|\d{4})\)?/;

    pages.forEach((page) => {
      const pageNumbers = page.filter((el) => options.includes(el.category));
    });
    return pages;
  }
  processPdf(sceneArr, name, numPages, callSheetPath = 'no callsheet') {
    
    this.initializePdfDocument(name, numPages, callSheetPath);
   
    let pages = this.collectPageNumbers(sceneArr);

    let sceneBreaks = this.recordSceneBreaks(sceneArr,numPages);

    let fullPages = this.constructFullPages(pages);

    let processedLines = this.setLinesInSceneToVisible(fullPages, sceneBreaks);

    let linesAsPages: any[] = this.buildFinalPages(processedLines);

    this.assignContinueMarkers(linesAsPages);

    let sanitizedPages = this.hideExtraPageNumberText(linesAsPages);

    sanitizedPages = this.hideExtraDraftVersionText(sanitizedPages);

    this.addSceneNumberText(sanitizedPages);

    this.finalDocument.data = sanitizedPages;

    this.finalDocReady = true;
  
    return true
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

  recordSceneBreaks = (sceneArr, numPages) => {    
    const acceptableTypes = ["dialog", "description", "shot", "short-dialog", "first-description", "parenthetical"];
    let flattenedLines = numPages.flat();

    let scenesWithAdjustedEnds = sceneArr.map(scene => {

        let lastLineIndex = scene.lastLine || sceneArr.length;
        while (lastLineIndex > scene.firstLine && !acceptableTypes.includes(flattenedLines[lastLineIndex].category)) {
            lastLineIndex--;
        }

        return {
            first: scene.firstLine,
            last: lastLineIndex,
            scene: scene.sceneNumberText,
            firstPage: scene.page,
        };
    });

    return scenesWithAdjustedEnds;
}

  constructFullPages(pages) {
    return pages.map((page) => {
      let doc = this.allLines.filter((scene) => scene.page === page);
      doc.push({
        page: page,
        bar: 'noBar',
        hideCont: 'hideCont',
        hideEnd: 'hideEnd',
        yPos: 50,
        category: 'injected-break',
        visible: 'true',
      });
      return doc;
    });
  }

  buildFinalPages(processedLines) {
    let finalPages = {};
    processedLines.forEach((line) => {
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
    breaks.forEach((breakInfo) => {
      // Find the last line of the current scene
      const lastLineOfScene = processedLines.flat().find(
        (line) => line.index === breakInfo.last
      );

      if (lastLineOfScene) {
        // If the last line is a 'page-number', assign 'END' to the previous visible line
        if (lastLineOfScene.category === 'page-number') {
          // Find the previous line that is not a 'page-number'
          let prevLineIndex = processedLines.indexOf(lastLineOfScene) - 1;
          while (
            prevLineIndex >= 0 &&
            processedLines[prevLineIndex].category === 'page-number'
          ) {
            prevLineIndex--;
          }
          if (prevLineIndex >= 0) {
            processedLines[prevLineIndex].end = 'END';
            processedLines[prevLineIndex].barY =
              processedLines[prevLineIndex].yPos - 5;
          }
        } else {
          // Mark the last line with 'END'
          lastLineOfScene.end = 'END';
          lastLineOfScene.barY = lastLineOfScene.yPos - 5;
        }
      }
    });

    return processedLines;
  }
  assignContinueMarkers(documentPages) {
    let currentScene = null;
    let foundContinue = false;

    documentPages.forEach((currentPage, pageIndex) => {
      let nextPage = documentPages[pageIndex + 1] || null;

      currentPage.forEach((line, lineIndex) => {
        // Set current scene if a scene header is encountered
        if (line.category === 'scene-header' && line.visible === 'true') {
          if (currentScene && currentScene !== line.scene) {
            // New scene encountered, break the loop
            return;
          }
          currentScene = line.scene;
        }

        // Check if the end of the current page is reached
        if (lineIndex === currentPage.length - 1) {
          // Iterate backwards to find 'CONTINUE'
          for (
            let i = currentPage.length - 1;
            i >= Math.max(0, currentPage.length - 5);
            i--
          ) {
            let lineToCheck = currentPage[i];
            if (
              this.conditions.includes(lineToCheck.category) &&
            
              lineToCheck.visible === 'true' &&
              !foundContinue
              ) {
              if(lineToCheck.finalLineOfScript || lineToCheck.end === "END") {
                break
              }
                foundContinue = true;
                lineToCheck.cont = 'CONTINUE';
                break;
              }
            }
            if (foundContinue && nextPage) {
              for (let j = 0; j < Math.min(5, nextPage.length); j++) {
                let nextLineToCheck = nextPage[j];
                if (
                  nextLineToCheck.scene === currentScene &&
                  this.conditions.includes(nextLineToCheck.category) &&
                  nextLineToCheck.category !== 'page-number' &&
                  nextLineToCheck.visible === 'true'
                ) {
                  nextLineToCheck.cont = 'CONTINUE-TOP';
                  break;
                }
              }
            }
          }
        });
      foundContinue = false;
    });
  }

  findTrueSceneHeaderIndexes(pages) {
    const trueSceneHeaderIndexes = [];
    pages.forEach((page, pageIndex) => {
      page.forEach((line, lineIndex) => {
        // Check if the line is a 'scene-header' and marked as 'true-scene'
        if (line.category === 'scene-header' && line.visible === 'true') {
          trueSceneHeaderIndexes.push({ pageIndex, lineIndex });
        }
      });
    });

    return trueSceneHeaderIndexes;
  }

  findFirstRelevantLineOnEachPage(pages) {
    const firstRelevantLines = pages.map((page) => {
      // Find the first line that is not an 'injected break' or 'scene header'
      return page.find(
        (line) =>
          line.category !== 'injected-break' && line.category !== 'scene-header'
      );
    });

    return firstRelevantLines;
  }

  addSceneNumberText(pages) {
    let currentSceneHeader;
    pages.forEach((page) => {
      page.forEach((line) => {
        // Check for the start of a new true scene
        if (line.category === 'scene-header' && line.visible === 'true') {
          currentSceneHeader = line;
        }

        // If we are within a true scene, assign sceneNumberText to relevant lines
        if (currentSceneHeader && line.index <= currentSceneHeader.lastLine) {
          if (
            line.cont === 'CONTINUE' ||
            line.cont === 'CONTINUE-TOP' ||
            line.end === 'END'
          ) {
            line.sceneNumberText = currentSceneHeader.sceneNumberText;
          }

          // If this line is the last line of the current scene, reset currentSceneHeader
          if (line.index === currentSceneHeader.lastLine) {
            currentSceneHeader = null;
          }
        }
      });
    });
  }
  // dont fucking touch it - it works
  getPdf(sceneArr, name, numPages, callSheetPath = 'no callsheet') {
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
      let doc = this.allLines.filter((scene) => scene.page === page);
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
  processSceneHeader(lineInDataTable, lineInScript) {
    // 86B-86COMITTED86B-86C  < --- strangest example we have founnd
    // reged for any numbers followed by any ammount of letters and a possible . and then the same thing
    const bookendPatternRegex = /^(\d+[A-Za-z]*)(.*)(\1)$/;

    const match = lineInDataTable.text.match(bookendPatternRegex);

    if (match) {
      // Now match[1] and match[3] should be the same, capturing the bookending pattern
      const sceneNumberText = match[1]; // The bookending pattern (repeated at both ends)
      const sceneContent = match[2].trim(); // The content of the scene header without the bookending patterns
      // update text in table ref
      lineInDataTable.text = sceneContent;
      lineInDataTable.sceneNumberText = sceneNumberText;
      // update actual doc in the service
      lineInScript.sceneNumberText = sceneNumberText;
      lineInScript.text = sceneContent;
    }
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
              this.allLines[currentScene.index - 1].index);
        currentScene.preview = this.getPreview(i);
        currentScene.lastPage = this.getLastPage(currentScene);
      } else {
        // get first and last lines for last scenes
        last =
          this.allLines[this.allLines.length - 1].index ||
          this.allLines.length - 1;
        currentScene.firstLine = this.allLines[currentScene.index - 1].index;
        currentScene.lastLine = last;
        currentScene.lastPage = this.getLastPage(currentScene);
        currentScene.preview = this.getPreview(i);
      }
    }
  }

  getLastPage = (scene) => {
    
    return this.allLines[scene.lastLine].page || null;
  };

  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.allLines[this.scenes[ind].index + 1]?.text +
      ' ' +
      this.allLines[this.scenes[ind].index + 2]?.text)
      ? this.allLines[this.scenes[ind].index + 2]?.text
      : ' ';
  }
}
