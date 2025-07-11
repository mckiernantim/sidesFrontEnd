import { Injectable } from '@angular/core';
import { UploadService } from '../upload/upload.service';
import { skip } from 'rxjs/operators';
import { LINE_TYPES} from '../../types/LineTypes'
import * as scriptData from '../../testingData/pdfServiceData/mockScriptData.json';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { UndoService, UndoStackItem } from '../edit/undo.service';

/*  
  THIS SHOULD BE ITS OWN 4 OR 5 SERVICES ALL IMPORTED INTO THE PARENT SERVICE OF PDF 
  PERHAPPS LINE-SERVICE, SCENE-SERVICE, DOCUMENT-SERVICE ETC  
*/
import { Line } from 'src/app/types/Line';
import { cloneDeep } from 'lodash';

// Add this interface at the top of the file, after the imports
interface SceneBreak {
  first: number;
  last: number;
  scene: string;
  firstPage: number;
}

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

  // Add initialDocumentState property
  private initialDocumentState: any;
  private _documentReordered$ = new BehaviorSubject<boolean>(false);
  public documentReordered$ = this._documentReordered$.asObservable();
  // 1/5 WE NEED TO MOVE THIS SO THAT THIS FIRES EVERY TIME THE USER NAVIGATES TO UPLOAD COMPONENT
  constructor(public upload: UploadService, private undoService: UndoService) {
    this.initializeData();
    
    // Set the PdfService reference in UndoService to avoid circular dependency
    this.undoService.setPdfService(this);
    
    // Subscribe to reset events
    this.undoService.reset$.subscribe(() => {
      this.resetToInitialState();
    });
    
    // Subscribe to undo/redo stack changes if needed for UI updates
    // (though components probably don't need this)
  }
  
  // Single source of truth for document updates
  private _finalDocumentData$ = new BehaviorSubject<{
    docPageIndex: number;
    docPageLineIndex: number;
    line: Line;
  } | null>(null);
  
  private _documentRegenerated$ = new BehaviorSubject<boolean>(false);
  public documentRegenerated$ = this._documentRegenerated$.asObservable();
public finalDocumentData$ = this._finalDocumentData$.asObservable();

updateLine(pageIndex: number, lineIndex: number, updates: Partial<Line>): void {
  if (!this.finalDocument?.data || 
      !this.finalDocument.data[pageIndex] || 
      !this.finalDocument.data[pageIndex][lineIndex]) {
    return;
  }

  const line = this.finalDocument.data[pageIndex][lineIndex];
  
  // Record the previous state for undo before making changes
  this.undoService.recordLineChange(
    pageIndex,
    lineIndex,
    { ...line }, // Clone the current state
    `Update line: ${Object.keys(updates).join(', ')}`
  );
  
  Object.assign(line, updates);

  // Emit the updated line
  this._finalDocumentData$.next({
    docPageIndex: pageIndex,
    docPageLineIndex: lineIndex,
    line: { ...line }
  });
}

updateLines(updates: Array<{
  pageIndex: number;
  lineIndex: number;
  updates: Partial<Line>;
}>): void {
  if (!this.finalDocument?.data || !updates.length) return;

  // Record the previous state of all lines before making changes
  const batchChanges = updates.map(({ pageIndex, lineIndex, updates: lineUpdates }) => {
    const line = this.finalDocument.data[pageIndex][lineIndex];
    if (line) {
      return {
        pageIndex,
        lineIndex,
        currentLineState: { ...line }, // Clone the current state
        changeDescription: `Batch update: ${Object.keys(lineUpdates).join(', ')}`
      };
    }
    return null;
  }).filter(Boolean);

  // Record all changes in the undo stack
  this.undoService.recordBatchChanges(batchChanges);

  updates.forEach(({ pageIndex, lineIndex, updates: lineUpdates }) => {
    const line = this.finalDocument.data[pageIndex][lineIndex];
    if (line) {
      Object.assign(line, lineUpdates);
      this._finalDocumentData$.next({
        docPageIndex: pageIndex,
        docPageLineIndex: lineIndex,
        line
      });
    }
  });
}

// Add method to get a specific line
getLine(pageIndex: number, lineIndex: number): Line | null {
  if (!this.finalDocument?.data || 
      !this.finalDocument.data[pageIndex] || 
      !this.finalDocument.data[pageIndex][lineIndex]) {
    return null;
  }
  return this.finalDocument.data[pageIndex][lineIndex];
}

// Add method to get all lines for a specific page
getPageLines(pageIndex: number): Line[] | null {
  if (!this.finalDocument?.data || !this.finalDocument.data[pageIndex]) {
    return null;
  }
  return this.finalDocument.data[pageIndex];
}

// Add method to get all pages
getAllPages(): Line[][] | null {
  if (!this.finalDocument?.data) {
    return null;
  }
  return this.finalDocument.data;
}

/**
 * Helper method for backward compatibility with existing component code
 * Extracts coordinates from line object and calls main updateLine method
 */
updateLineFromObject(line: any, updates: Partial<Line>): void {
  if (line.docPageIndex !== undefined && line.docPageLineIndex !== undefined) {
    this.updateLine(line.docPageIndex, line.docPageLineIndex, updates);
  } else {
    console.warn('[PDF Service] Line object missing docPageIndex or docPageLineIndex');
  }
}

/**
 * Helper method for batch updates from line objects (for existing component code)
 */
updateLinesFromObjects(lineUpdates: Array<{ line: any; updates: Partial<Line> }>): void {
  const batchUpdates = lineUpdates
    .filter(({ line }) => line.docPageIndex !== undefined && line.docPageLineIndex !== undefined)
    .map(({ line, updates }) => ({
      pageIndex: line.docPageIndex,
      lineIndex: line.docPageLineIndex,
      updates
    }));

  if (batchUpdates.length > 0) {
    this.updateLines(batchUpdates);
  } else {
    console.warn('[PDF Service] No valid line objects found for batch update');
  }
}

// ADD this helper method to get current line state (useful for undo recording)
getLineState(pageIndex: number, lineIndex: number): Line | null {
  if (this.finalDocument?.data && 
      this.finalDocument.data[pageIndex] && 
      this.finalDocument.data[pageIndex][lineIndex]) {
    return this.finalDocument.data[pageIndex][lineIndex];
  }
  return null;
}

// KEEP the resetToInitialState method (called by undo reset)
resetToInitialState(): void {
  if (this.initialDocumentState) {
    this.finalDocument = JSON.parse(JSON.stringify(this.initialDocumentState));
    // Initial state is handled by components
    this.finalDocReady = true;
  }
}
// Add these methods to your PdfService for better undo integration:

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
  
  
  
  

  processLines(merged: Line[], breaks: SceneBreak[]) {
    // start with a zeroed index for the currentSceneBreak
    let currentBreakIndex = 0;
    // get the first scene break - where the scene ends
    let currentSceneBreak = breaks[currentBreakIndex];
    
    // Process each line
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

    // When processing lines, preserve custom bar text and position properties
    for (let i = 0; i < merged.length; i++) {
      const line = merged[i];
      const processedLine = merged[i];
      
      // Preserve text offset positions (using left/right instead of padding)
      if (line.startTextOffset !== undefined) {
        processedLine.startTextOffset = line.startTextOffset;
      }
      
      if (line.endTextOffset !== undefined) {
        processedLine.endTextOffset = line.endTextOffset;
      }
      
      if (line.continueTextOffset !== undefined) {
        processedLine.continueTextOffset = line.continueTextOffset;
      }
      
      if (line.continueTopTextOffset !== undefined) {
        processedLine.continueTopTextOffset = line.continueTopTextOffset;
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
      line.barY = line.yPos + 20; 
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
  // In pdf.service.ts - REPLACE the existing reorderScenes method with this:

  reorderScenes(newSceneOrder: any[], shouldRecordUndo: boolean = false): void {
    console.log('Reordering scenes:', newSceneOrder.map(s => s.sceneNumberText));
    
    if (!this.finalDocument?.data || !this.finalDocReady) {
      console.warn('Cannot reorder: no document data available');
      return;
    }
  
    // RECORD THE COMBINED UNDO STATE ONLY WHEN REQUESTED
    if (shouldRecordUndo) {
      const currentSceneOrder = this.getCurrentSceneOrder();
      const currentDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
      
      this.undoService.recordSceneReorderChange(
        currentSceneOrder, // Current scene order before reordering
        currentDocumentState, // Current document state before reordering
        `Reorder scenes: ${currentSceneOrder[0]?.sceneNumberText || 'Unknown'} moved to new position`
      );
      
      console.log('Combined undo state recorded for scene reordering');
    }
  
    // CREATE A MAP OF SCENE NUMBERS TO ALL THEIR PAGE INDEXES (scenes can span multiple pages)
    const sceneToPageIndexes = new Map<string, number[]>();
    const pageToPrimaryScene = new Map<number, string>();
    
    // First pass: Find pages with scene headers (primary scene pages)
    this.finalDocument.data.forEach((page, pageIndex) => {
      const sceneHeader = page.find(line => 
        line.category === 'scene-header' && line.visible === 'true'
      );
      if (sceneHeader?.sceneNumberText) {
        const sceneNumber = sceneHeader.sceneNumberText;
        if (!sceneToPageIndexes.has(sceneNumber)) {
          sceneToPageIndexes.set(sceneNumber, []);
        }
        sceneToPageIndexes.get(sceneNumber)!.push(pageIndex);
        pageToPrimaryScene.set(pageIndex, sceneNumber);
      }
    });
  
    // Second pass: Find continuation pages and assign them to the appropriate scene
    this.finalDocument.data.forEach((page, pageIndex) => {
      // Skip if this page already has a primary scene
      if (pageToPrimaryScene.has(pageIndex)) {
        return;
      }
      
      // Find the most relevant scene for this page
      let primarySceneNumber: string | null = null;
      let maxSceneLines = 0;
      
      page.forEach(line => {
        if (line.sceneNumberText) {
          // Count lines for this scene on this page
          const sceneLines = page.filter(l => l.sceneNumberText === line.sceneNumberText).length;
          if (sceneLines > maxSceneLines) {
            maxSceneLines = sceneLines;
            primarySceneNumber = line.sceneNumberText;
          }
        }
      });
      
      if (primarySceneNumber && sceneToPageIndexes.has(primarySceneNumber)) {
        sceneToPageIndexes.get(primarySceneNumber)!.push(pageIndex);
        pageToPrimaryScene.set(pageIndex, primarySceneNumber);
        console.log(`Assigned page ${pageIndex} to scene ${primarySceneNumber} (continuation)`);
      }
    });
  
    // Sort page indexes for each scene to maintain order
    sceneToPageIndexes.forEach((pageIndexes, sceneNumber) => {
      pageIndexes.sort((a, b) => a - b);
    });
  
    console.log('Scene to page mapping:', Array.from(sceneToPageIndexes.entries()));
  
    // Create new page order based on scene order
    const newPageOrder: any[] = [];
    const usedPageIndexes = new Set<number>();
  
    // Add ALL pages for each scene in the new order
    newSceneOrder.forEach(scene => {
      const pageIndexes = sceneToPageIndexes.get(scene.sceneNumberText);
      if (pageIndexes) {
        console.log(`Processing scene ${scene.sceneNumberText} with pages:`, pageIndexes);
        // Add all pages for this scene in their original order
        pageIndexes.forEach(pageIndex => {
          if (!usedPageIndexes.has(pageIndex)) {
            newPageOrder.push(this.finalDocument.data[pageIndex]);
            usedPageIndexes.add(pageIndex);
            console.log(`Added page ${pageIndex} for scene ${scene.sceneNumberText}`);
          } else {
            console.log(`Skipping duplicate page ${pageIndex} for scene ${scene.sceneNumberText}`);
          }
        });
      } else {
        console.log(`No pages found for scene ${scene.sceneNumberText}`);
      }
    });
  
    // Add any remaining pages that weren't part of scenes
    this.finalDocument.data.forEach((page, pageIndex) => {
      if (!usedPageIndexes.has(pageIndex)) {
        newPageOrder.push(page);
        console.log(`Added remaining page ${pageIndex}`);
      }
    });
  
    console.log(`Reordered from ${this.finalDocument.data.length} to ${newPageOrder.length} pages`);
    console.log('Final page order indexes:', newPageOrder.map((_, index) => index));
  
    // Update finalDocument.data with new order
    this.finalDocument.data = newPageOrder;
  
    // ONLY update docPageIndex and docPageLineIndex - leave everything else alone
    this.finalDocument.data.forEach((page, newDocPageIndex) => {
      page.forEach((line, newDocPageLineIndex) => {
        line.docPageIndex = newDocPageIndex;
        line.docPageLineIndex = newDocPageLineIndex;
      });
    });
  
    console.log('Document reordered, new page count:', this.finalDocument.data.length);
    
    // Store the new scene order
    this._selectedScenes = [...newSceneOrder];
    
    // FIXED: Emit updates in the correct order and ensure they trigger
    this._documentReordered$.next(true);
    // Small delay to ensure document reordered is processed first
    setTimeout(() => {
      this._documentRegenerated$.next(true);
    }, 10);
  }
    
  setSelectedScenes(scenes: any[]): void {
    console.log('🔧 PDF Service: setSelectedScenes called with:', scenes?.map(s => s.sceneNumberText));
    this._selectedScenes = [...scenes];
    
    console.log('🔧 PDF Service: About to emit sceneOrderUpdated$ with:', scenes?.map(s => s.sceneNumberText));
    // Emit scene order update
    this._sceneOrderUpdated$.next([...scenes]);
    console.log('🔧 PDF Service: sceneOrderUpdated$ emitted successfully');
    
    // Don't automatically regenerate here - let reorderScenes handle that
    // This prevents double regeneration
  }
  getCurrentSceneOrder(): any[] {
    return [...this._selectedScenes];
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
    console.log('Processing PDF with scenes:', sceneArr);

    this.initializePdfDocument(name, numPages, callSheetPath);
   
    // Collect all pages needed for the scenes
    let pages = this.collectPageNumbers(sceneArr);
    console.log('Collected pages:', pages);

    // Record scene breaks maintaining the provided order
    let sceneBreaks = this.recordSceneBreaks(sceneArr, numPages);
    console.log('Recorded scene breaks:', sceneBreaks);

    // Store the original scene order for later use
    const originalSceneOrder = sceneArr.map(scene => ({
      sceneNumberText: scene.sceneNumberText,
      firstLine: scene.firstLine,
      lastLine: scene.lastLine,
      page: scene.page,
      lastPage: scene.lastPage
    }));
    console.log('Original scene order:', originalSceneOrder);

    // Construct full pages with all necessary content
    let fullPages = this.constructFullPages(pages);
    console.log('Constructed full pages:', fullPages.length);

    // Process lines maintaining the scene order
    let processedLines = this.setLinesInSceneToVisible(fullPages, sceneBreaks);
    console.log('Processed lines:', processedLines.length);

    // Build final pages maintaining order
    let linesAsPages: any[] = this.buildFinalPages(processedLines);
    console.log('Built final pages:', linesAsPages.length);
    
    this.assignContinueMarkers(linesAsPages);

    let sanitizedPages = this.hideExtraPageNumberText(linesAsPages);
    sanitizedPages = this.hideExtraDraftVersionText(sanitizedPages);

    this.addSceneNumberText(sanitizedPages);

    // Reorder the final pages based on the original scene order
    const reorderedPages = this.reorderPagesBySceneOrder(sanitizedPages, originalSceneOrder);
    console.log('Reordered pages:', reorderedPages.length);

    // Store the final document with the maintained order
    this.finalDocument.data = reorderedPages;
    // Initial state is handled by components

    // Save initial state after document is fully processed
    this.initialDocumentState = JSON.parse(JSON.stringify(this.finalDocument));

    this.updatePageNumberVisibility();

    this.finalDocReady = true;
    this._documentRegenerated$.next(true);
    return true;
  }

  private reorderPagesBySceneOrder(pages: any[], originalSceneOrder: any[]): any[] {
    // Create a map of scene numbers to their page ranges
    const scenePageRanges = new Map<string, { startPage: number, endPage: number }>();
    
    // First, identify the page ranges for each scene
    originalSceneOrder.forEach(scene => {
      scenePageRanges.set(scene.sceneNumberText, {
        startPage: scene.page,
        endPage: scene.lastPage
      });
    });

    // Create a new array to hold our reordered pages
    const reorderedPages: any[] = [];
    // Track which pages we've already added
    const addedPages = new Set<number>();
    
    // Add pages in the order specified by originalSceneOrder
    originalSceneOrder.forEach(scene => {
      const range = scenePageRanges.get(scene.sceneNumberText);
      if (range) {
        // Add all pages for this scene in order
        for (let pageNum = range.startPage; pageNum <= range.endPage; pageNum++) {
          // Only add the page if we haven't added it before
          if (!addedPages.has(pageNum)) {
            const page = pages.find(p => p[0]?.page === pageNum);
            if (page) {
              reorderedPages.push(page);
              addedPages.add(pageNum);
            }
          }
        }
      }
    });

    // Add any remaining pages that weren't part of scenes
    const remainingPages = pages.filter(page => {
      const pageNum = page[0]?.page;
      return !addedPages.has(pageNum);
    });

    // Sort remaining pages by their page number
    remainingPages.sort((a, b) => a[0]?.page - b[0]?.page);
    reorderedPages.push(...remainingPages);

    // Reindex all pages and lines
    reorderedPages.forEach((page, pageIndex) => {
      page.forEach((line: Line, lineIndex: number) => {
        // Update document-wide indexes
        line.docPageIndex = pageIndex;
        line.docPageLineIndex = lineIndex;
        
        // Update page number if it exists
        if (line.category === 'page-number') {
          line.text = (pageIndex + 1).toString();
        }
      });
    });

    return reorderedPages;
  }

  collectPageNumbers(sceneArr) {
    let pages = new Set<number>();
    sceneArr.forEach((scene) => {
      // Get all pages between first and last page of the scene
      for (let i = scene.page; i <= scene.lastPage; i++) {
        pages.add(i);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  }

  recordSceneBreaks = (sceneArr, numPages) => {    
    const acceptableTypes = ["dialog", "description", "shot", "short-dialog", "first-description", "parenthetical"];
    let flattenedLines = numPages.flat();

    // Process scenes in the order they are provided
    let scenesWithAdjustedEnds = sceneArr.map(scene => {
        let lastLineIndex = scene.lastLine || sceneArr.length;
        while (lastLineIndex > scene.firstLine && !acceptableTypes.includes(flattenedLines[lastLineIndex]?.category)) {
            lastLineIndex--;
        }

        return {
            first: scene.firstLine,
            last: lastLineIndex,
            scene: scene.sceneNumberText,
            firstPage: scene.page,
            lastPage: scene.lastPage
        };
    });

    console.log('Processed scene breaks:', scenesWithAdjustedEnds);
    return scenesWithAdjustedEnds;
  }

  constructFullPages(pages) {
    return pages.map((page) => {
      let doc = this.allLines.filter((scene) => scene.page === page);
      // Add a scene break line
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

  buildFinalPages(processedLines: Line[]) {
    let finalPages: { [key: string]: Line[] } = {};
    processedLines.forEach((line) => {
      // Initialize an array for each page number
      if (!finalPages[line.page]) {
        finalPages[line.page] = [];
      }
      // Add the line to the corresponding page
      finalPages[line.page].push(line);
    });

    const sortedPageNumbers = Object.keys(finalPages)
      .map(pageNum => parseInt(pageNum))
      .sort((a, b) => a - b);
  
    let finalPagesArray: Line[][] = sortedPageNumbers.map(pageNum => 
      finalPages[pageNum.toString()]
    );
    

    // Add document-wide indexes to each line
    finalPagesArray.forEach((page, pageIndex) => {
      page.forEach((line, lineIndex) => {
        // Add document-wide indexes
        line.docPageIndex = pageIndex;
        line.docPageLineIndex = lineIndex;
      });
    });

    // When building pages, ensure bar positions are preserved
    for (const page of finalPagesArray) {
      for (const line of page) {
        // Preserve bar positions from edited document
        if (line.cont === 'CONTINUE' || line.cont === 'CONTINUE-TOP') {
          // Ensure the calculatedBarY position is preserved
          if(!line.calculatedBarY && line.cont === 'CONTINUE-TOP') {
            line.calculatedBarY = 980 + 'px';
          }
          if (!line.calculatedBarY && line.barY) {
            line.calculatedBarY = typeof line.barY === 'number' 
              ? line.barY + 'px' 
              : line.barY;
          }
        }
        
        if (line.end === 'END') {
          // Ensure the calculatedEnd position is preserved
          if (!line.calculatedEnd && line.endY) {
            line.calculatedEnd = typeof line.endY === 'number' 
              ? line.endY + 'px' 
              : line.endY;
          }
        }
      }
    }

    // Ensure only one page number per page
    for (const pageKey in finalPages) {
      const page = finalPages[pageKey];
      let foundPageNumber = false;
      
      for (let i = 0; i < page.length; i++) {
        const line = page[i];
        
        if (line.category === 'page-number') {
          if (foundPageNumber) {
            // This is a duplicate page number, mark it as hidden
            line.category = 'page-number-hidden';
          } else {
            foundPageNumber = true;
          }
        }
      }
    }
    for (const page of finalPagesArray) {
      for (const line of page) {
        // Calculate positions from raw values (like Last-Looks does)
        if (line.yPos !== undefined) {
          line.calculatedYpos = line.calculatedYpos || (Number(line.yPos) * 1.3 + 'px');
        }
        
        if (line.xPos !== undefined) {
          line.calculatedXpos = line.calculatedXpos || (Number(line.xPos) * 1.3 + 'px');
        }
        
        if (line.barY !== undefined) {
          line.calculatedBarY = line.calculatedBarY || (Number(line.barY) * 1.3) - 30 + 'px';
        }
        
        if (line.endY !== undefined) {
          line.calculatedEnd = line.calculatedEnd || (Number(line.endY) * 1.3 + 'px');
        }
        
        // Set visibility default
        if (line.visible === undefined) {
          line.visible = 'true';
        }
      }
    }
 
    return finalPagesArray;
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
  /**
   * Assigns continue markers to lines that continue across pages
   * Only applies to specific line types (character, dialog, shot, action)
   */
  assignContinueMarkers(pages: any[]): void {
    if (!pages || pages.length <= 1) return;
    
    // Define categories that can receive continuation markers
    const continuableCategories = [
      'character', 
      'dialog', 
      'shot', 
      'action', 
      'first-description', 
      'description',
      'scene-header'
    ];
    
    // Process each page
    for (let i = 1; i < pages.length; i++) { // Start from second page
      const currentPage = pages[i];
      const previousPage = pages[i-1];
      
      if (!Array.isArray(currentPage) || !Array.isArray(previousPage)) continue;
      
      // Find first visible continuable line on current page
      let firstVisibleLine = null;
      for (let j = 0; j < currentPage.length; j++) {
        const line = currentPage[j];
        if (line && 
            line.visible === 'true' && 
            line.category !== 'injected-break' &&
            continuableCategories.includes(line.category)) {
          firstVisibleLine = line;
          break;
        }
      }
      
      // If first line isn't a scene header, it's a continuation
      if (firstVisibleLine && firstVisibleLine.category !== 'scene-header') {
        // Mark as continuation from previous page
        firstVisibleLine.cont = 'CONTINUE-TOP';
        
        // Only set position if it hasn't been set before
        if (!firstVisibleLine.barY || !firstVisibleLine.calculatedBarY) {
          const topPosition = 40 ; // Default position from top
          firstVisibleLine.barY = topPosition;
          firstVisibleLine.calculatedBarY = topPosition + 'px';
        }
        
        // Find last visible continuable line on previous page - simple backwards iteration
        for (let j = previousPage.length - 1; j >= 0; j--) {
          const line = previousPage[j];
          if (line && 
              line.visible === 'true' && 
              line.category !== 'injected-break' &&
              continuableCategories.includes(line.category)) {
            // Mark this line as CONTINUE
            line.cont = 'CONTINUE';
            
            // Only set position if it hasn't been set before
            if (!line.barY || !line.calculatedBarY) {
              const topPosition = 90; // Default position from top
              line.barY = topPosition;
              line.calculatedBarY = topPosition + 'px';
            }
            
            // We found our line, no need to continue
            break;
          }
        }
      }
    }
    
    console.log('Continuation markers assigned');
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
    let currentScene = this.scenes[i];
    let next = this.scenes[i + 1];
    
    // Set firstLine for all scenes
    if (currentScene.index === 0) {
      currentScene.firstLine = 0;
    } else {
      currentScene.firstLine = this.allLines[currentScene.index - 1]?.index || currentScene.index - 1;
    }
    
    // Set lastLine for all scenes
    if (next) {
      // For scenes with a next scene, lastLine is the line before the next scene
      currentScene.lastLine = next.index - 1;
    } else {
      // For the last scene, lastLine is the last line of the script
      currentScene.lastLine = this.allLines.length - 1;
    }
    
    // Set preview and lastPage
    currentScene.preview = this.getPreview(i);
    currentScene.lastPage = this.getLastPage(currentScene);
  }

  getLastPage = (scene) => {
    
    return this.allLines[scene.lastLine]?.page || null;
  };

  getPreview(ind) {
    return (this.scenes[ind].preview =
      this.allLines[this.scenes[ind].index + 1]?.text +
      ' ' +
      this.allLines[this.scenes[ind].index + 2]?.text)
      ? this.allLines[this.scenes[ind].index + 2]?.text
      : ' ';
  }

  private _selectedScenes: any[] = [];
  private _sceneNumberUpdated$ = new Subject<{ scene: any, newSceneNumber: string }>();
  private _sceneHeaderTextUpdated$ = new Subject<{ scene: any, newText: string }>();
  private _sceneOrderUpdated$ = new Subject<any[]>();

  getSelectedScenes(): any[] {
    return this._selectedScenes;
  }



  // Add this function to check if a page has any visible content besides page numbers
  private pageHasVisibleContent(page: any[]): boolean {
    if (!page || page.length === 0) return false;
    
    // Check if there's at least one visible element that isn't a page number
    return page.some(line => 
      line.visible === 'true' && 
      line.category !== 'page-number' && 
      line.category !== 'injected-break'
    );
  }

  // Add this to the processPdf function right before returning
  updatePageNumberVisibility() {
    if (!this.finalDocument || !this.finalDocument.data) return;
    
    const pages = this.finalDocument.data;
    
    // First, identify pages with no visible content
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const hasVisibleContent = this.pageHasVisibleContent(page);
      
      // Update page number visibility based on page content
      for (const line of page) {
        if (line.category === 'page-number') {
          line.visible = hasVisibleContent ? 'true' : 'false';
        }
      }
    }
    
    // Then filter out pages that only have page numbers or injected breaks visible
    this.finalDocument.data = pages.filter(page => {
      const visibleElements = page.filter(line => line.visible === 'true');
      return visibleElements.some(line => 
        line.category !== 'page-number' && 
        line.category !== 'injected-break'
      );
    });
  }

  processDocument() {
    // First update page number visibility
    this.updatePageNumberVisibility();
    
    // Then filter out pages that only have page numbers visible
    this.finalDocument = this.finalDocument.filter(page => this.pageHasVisibleContent(page));
    
    return this.finalDocument;
  }

  // Add a method to save the current document state with all customizations
  saveDocumentState() {
    // Create a deep copy of the current document state
    const savedState = JSON.parse(JSON.stringify(this.finalDocument));
    
    // Process each page to ensure all custom properties are preserved
    for (let pageIndex = 0; pageIndex < savedState.data.length; pageIndex++) {
      const page = savedState.data[pageIndex];
      
      for (let lineIndex = 0; lineIndex < page.length; lineIndex++) {
        const line = page[lineIndex];
        
        // Convert calculated positions back to raw values for storage
        if (line.calculatedBarY) {
          // Extract numeric value from pixel string (e.g., "100px" -> 100)
          const barYValue = parseFloat(line.calculatedBarY);
          if (!isNaN(barYValue)) {
            // Convert back to raw value by dividing by 1.3
            line.barY = barYValue / 1.3;
          }
        }
        
        if (line.calculatedEnd) {
          const endYValue = parseFloat(line.calculatedEnd);
          if (!isNaN(endYValue)) {
            // Convert back to raw value by dividing by 1.3
            line.endY = endYValue / 1.3;
          }
        }
        
        if (line.calculatedYpos) {
          const yPosValue = parseFloat(line.calculatedYpos);
          if (!isNaN(yPosValue)) {
            // Convert back to raw value by dividing by 1.3
            line.yPos = yPosValue / 1.3;
          }
        }
        
        // Preserve all custom text and offset properties
        // These are already in the correct format for storage
      }
    }
    
    // Store the saved state
    this.finalDocument = savedState;
    
    // Also update the initial state for undo functionality
    this.initialFinalDocState = JSON.parse(JSON.stringify(savedState));
    
    return savedState;
  }

  // Update the loadDocument method to handle custom properties
  loadDocument(document: any) {
    this.finalDocument = document;
    
    // Process each page to ensure all custom properties are properly initialized
    for (let pageIndex = 0; pageIndex < this.finalDocument.data.length; pageIndex++) {
      const page = this.finalDocument.data[pageIndex];
      
      for (let lineIndex = 0; lineIndex < page.length; lineIndex++) {
        const line = page[lineIndex];
        
        // Convert raw values to calculated positions for display
        if (line.barY !== undefined && !line.calculatedBarY) {
          line.calculatedBarY = typeof line.barY === 'number' 
            ? line.barY + 'px' 
            : line.barY;
        }
        
        if (line.endY !== undefined && !line.calculatedEnd) {
          line.calculatedEnd = typeof line.endY === 'number' 
            ? line.endY + 'px' 
            : line.endY;
        }
        
        if (line.yPos !== undefined && !line.calculatedYpos) {
          line.calculatedYpos = typeof line.yPos === 'number' 
            ? line.yPos + 'px' 
            : line.yPos;
        }
        
        // Custom text and offset properties don't need conversion
        // They're already in the correct format
      }
    }
    
    // Store initial state for undo functionality
    this.initialFinalDocState = JSON.parse(JSON.stringify(this.finalDocument));
    
    return this.finalDocument;
  }

  updateSceneOrder(orderedScenes: any[]): void {
    // Record the current scene order for undo before making changes
    const currentSceneOrder = this.getCurrentSceneOrder();
    this.undoService.recordSceneOrderChange(
      currentSceneOrder,
      `Update scene order: ${currentSceneOrder.map(s => s.sceneNumberText).join(' → ')} → ${orderedScenes.map(s => s.sceneNumberText).join(' → ')}`
    );

    // Store the new order
    this._selectedScenes = orderedScenes;
    
    // If we already have a final document, update it with the new order
    if (this.finalDocReady && this.finalDocument) {
      this.processPdf(
        orderedScenes,
        this.finalDocument.name,
        this.finalDocument.numPages,
        this.finalDocument.callSheetPath
      );
    }
  }

  // Add method to get the current document's token
  getCurrentDocumentToken(): string | null {
    return localStorage.getItem('pdfToken');
  }

  // Add method to set the document token
  setDocumentToken(token: string, expirationTime: number): void {
    localStorage.setItem('pdfToken', token);
    localStorage.setItem('pdfTokenExpires', expirationTime.toString());
  }

  // Add method to check if token is valid
  isTokenValid(): boolean {
    const expirationTime = localStorage.getItem('pdfTokenExpires');
    if (!expirationTime) return false;
    
    const currentTime = Date.now();
    return currentTime < parseInt(expirationTime);
  }

  updateSceneNumber(scene: any, newSceneNumber: string): Observable<{ success: boolean }> {
    return new Observable(observer => {
      try {
        if (this.finalDocument && this.finalDocument.data) {
          // Record the previous state for undo before making changes
          const affectedLines: Array<{ pageIndex: number; lineIndex: number; line: Line }> = [];
          
          this.finalDocument.data.forEach((page, pageIndex) => {
            page.forEach((line, lineIndex) => {
              if (line.index === scene.index || line.sceneNumberText === scene.sceneNumberText) {
                affectedLines.push({
                  pageIndex,
                  lineIndex,
                  line: { ...line } // Clone the current state
                });
              }
            });
          });

          // Record all affected lines in the undo stack
          affectedLines.forEach(({ pageIndex, lineIndex, line }) => {
            this.undoService.recordLineChange(
              pageIndex,
              lineIndex,
              line,
              `Update scene number: "${scene.sceneNumberText}" → "${newSceneNumber}"`
            );
          });

          const updatedData = this.finalDocument.data.map(page => {
            return page.map(line => {
              // If this is the scene header line
              if (line.index === scene.index) {
                return { ...line, sceneNumberText: newSceneNumber };
              }
              
              // If this line is part of the same scene (based on sceneNumberText)
              if (line.sceneNumberText === scene.sceneNumberText) {
                return {
                  ...line,
                  sceneNumber: newSceneNumber,
                  sceneNumberText: newSceneNumber,
                  // Update text for specific line types
                  text: line.category === 'scene-header' ? line.text :
                        line.category === 'end' ? `END ${newSceneNumber}` :
                        (line.category === 'continue' || line.category === 'continue-top') ? 
                        `↓↓↓ ${newSceneNumber} CONTINUED ↓↓↓` : line.text
                };
              }
              return line;
            });
          });
          
          this.finalDocument.data = updatedData;
          
          // Emit the update through the subject
          this._sceneNumberUpdated$.next({ scene, newSceneNumber });
          
          observer.next({ success: true });
          observer.complete();
        } else {
          observer.next({ success: false });
          observer.complete();
        }
      } catch (error) {
        console.error('Error updating scene number:', error);
        observer.next({ success: false });
        observer.complete();
      }
    });
  }

  updateSceneText(scene: any, newText: string): Observable<{ success: boolean }> {
    return new Observable(observer => {
      try {
        if (this.finalDocument && this.finalDocument.data) {
          // Record the previous state for undo before making changes
          this.finalDocument.data.forEach((page, pageIndex) => {
            page.forEach((line, lineIndex) => {
              if (line.index === scene.index) {
                this.undoService.recordLineChange(
                  pageIndex,
                  lineIndex,
                  { ...line }, // Clone the current state
                  `Update scene text: "${line.text}" → "${newText}"`
                );
              }
            });
          });

          const updatedData = this.finalDocument.data.map(page => {
            return page.map(line => {
              if (line.index === scene.index) {
                return { ...line, text: newText };
              }
              return line;
            });
          });
          
          this.finalDocument.data = updatedData;
          
          // Let components handle the update
          
          observer.next({ success: true });
          observer.complete();
        } else {
          observer.next({ success: false });
          observer.complete();
        }
      } catch (error) {
        console.error('Error updating scene text:', error);
        observer.next({ success: false });
        observer.complete();
      }
    });
  }

  // Add getter for scene header text updates
  get sceneHeaderTextUpdated$(): Subject<{ scene: any, newText: string }> {
    return this._sceneHeaderTextUpdated$;
  }

  // Add getter for scene order updates
  get sceneOrderUpdated$(): Subject<any[]> {
    return this._sceneOrderUpdated$;
  }

  updateSceneHeaderText(scene: any, newText: string): Observable<{ success: boolean }> {
    return new Observable(observer => {
      try {
        if (this.finalDocument && this.finalDocument.data) {
          // Record the change for undo functionality
          this.undoService.recordLineChange(
            scene.docPageIndex,
            scene.docPageLineIndex,
            scene,
            `Edit scene text: "${scene.text}" → "${newText}"`
          );

          const updatedData = this.finalDocument.data.map(page => {
            return page.map(line => {
              if (line.index === scene.index) {
                // Update the scene header text
                const updatedLine = { ...line, text: newText };
                
                // If this is a scene header, update all related lines in the scene
                if (line.category === 'scene-header') {
                  // Find all lines in the same scene and update their scene text
                  const sceneLines = page.filter(l => 
                    l.sceneNumberText === line.sceneNumberText
                  );
                  sceneLines.forEach(l => {
                    if (l.category === 'scene-header') {
                      l.text = newText;
                    }
                  });
                }
                
                return updatedLine;
              }
              return line;
            });
          });
          
          this.finalDocument.data = updatedData;
          
          // Emit the update through the subject
          this._sceneHeaderTextUpdated$.next({ scene, newText });
          
          observer.next({ success: true });
          observer.complete();
        } else {
          observer.next({ success: false });
          observer.complete();
        }
      } catch (error) {
        console.error('Error updating scene header text:', error);
        observer.next({ success: false });
        observer.complete();
      }
    });
  }

  // Add method to handle callsheet upload
  async handleCallSheetUpload(callsheet: File): Promise<boolean> {
    try {
      if (!(callsheet instanceof File)) {
        console.error('Invalid callsheet: must be a File object');
        return false;
      }

      // Wait for the server to process the callsheet
      const response = await this.upload.postCallSheet(callsheet).toPromise();
      
      if (response && response.success && response.filePath) {
        this.callSheetPath = response.filePath;
        
        // Only insert the callsheet after successful server response
        if (this.finalDocument) {
          this.insertCallsheetAtStart(response.filePath);
          return true;
        }
      } else {
        console.error('Failed to upload callsheet:', response?.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Error uploading callsheet:', error);
      return false;
    }
  }
  
  get sceneNumberUpdated$(): Subject<{ scene: any, newSceneNumber: string }> {
    return this._sceneNumberUpdated$;
  }
  insertCallsheetAtStart(previewUrl: string): void {
    if (!this.finalDocument || !this.finalDocument.data) {
      console.warn('No document available to insert callsheet');
      return;
    }
  
    console.log('Inserting callsheet at start with preview URL:', previewUrl);
  
    // Check if callsheet already exists to avoid duplicates
    if (this.hasCallsheet()) {
      console.log('Callsheet already exists, removing before adding new one');
      this.removeCallsheetFromStart();
    }
  
    // Record the current document state for undo before making changes
    const currentDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
    this.undoService.recordDocumentReorderChange(
      currentDocumentState,
      `Insert callsheet at start`
    );
  
    // Ensure the preview URL is valid and properly formatted
    let validPreviewUrl = previewUrl;
    if (!validPreviewUrl || validPreviewUrl.trim() === '') {
      console.error('Invalid preview URL provided');
      return;
    }
  
    // Better URL validation and formatting
    if (validPreviewUrl.startsWith('blob:') || validPreviewUrl.startsWith('data:')) {
      // Keep blob and data URLs as-is
      console.log('Using blob/data URL:', validPreviewUrl);
    } else if (validPreviewUrl.startsWith('http://') || validPreviewUrl.startsWith('https://')) {
      // Keep absolute URLs as-is
      console.log('Using absolute URL:', validPreviewUrl);
    } else if (validPreviewUrl.startsWith('/')) {
      // Already has leading slash
      console.log('Using relative URL with slash:', validPreviewUrl);
    } else {
      // Add leading slash for relative URLs
      validPreviewUrl = '/' + validPreviewUrl;
      console.log('Added leading slash to URL:', validPreviewUrl);
    }
  
    console.log('Using validated preview URL:', validPreviewUrl);
  
    // Create a callsheet page object with the preview image
    const callsheetPage = [{
      type: 'callsheet',
      category: 'callsheet',
      imagePath: validPreviewUrl,
      visible: 'true',
      docPageIndex: 0,
      docPageLineIndex: 0,
      // Ensure consistent positioning
      calculatedXpos: '0px',
      calculatedYpos: '0px',
      xPos: 0,
      yPos: 0,
      // Required properties for line consistency
      text: 'CALLSHEET',
      index: -1, // Special index for callsheet
      page: 0,
      // Error handling
      loadError: null,
      // Prevent any bars or markers
      bar: 'hideBar',
      cont: 'hideCont',
      end: 'hideEnd',
      hidden: '',
      trueScene: ''
    }];
  
    // Store original document length for validation
    const originalLength = this.finalDocument.data.length;
    
    // Insert the callsheet at the beginning
    this.finalDocument.data.unshift(callsheetPage);
  
    // CRITICAL: Properly reindex ALL subsequent pages
    for (let i = 1; i < this.finalDocument.data.length; i++) {
      const page = this.finalDocument.data[i];
      
      // Validate that this is actually a page with lines
      if (!Array.isArray(page) || page.length === 0) {
        console.warn(`Found empty or invalid page at index ${i}, removing it`);
        this.finalDocument.data.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }
  
      // Update each line in the page
      page.forEach((line, lineIndex) => {
        if (line) {
          // Update document-wide indexes
          line.docPageIndex = i;
          line.docPageLineIndex = lineIndex;
          
          // Update page numbers for display (keep original script page numbering)
          if (line.category === 'page-number') {
            // Keep original page numbering (don't account for callsheet)
            line.text = (i).toString();
          }
        }
      });
    }
  
    // Update document metadata
    this.finalDocument.numPages = this.finalDocument.data.length;
  
    // Validate the final structure
    console.log('Document structure after callsheet insertion:', {
      originalPages: originalLength,
      newTotalPages: this.finalDocument.data.length,
      firstPageType: this.finalDocument.data[0]?.[0]?.type,
      firstPageLines: this.finalDocument.data[0]?.length,
      secondPageType: this.finalDocument.data[1]?.[0]?.category,
      secondPageLines: this.finalDocument.data[1]?.length,
      callsheetImagePath: this.finalDocument.data[0]?.[0]?.imagePath
    });
  
    // Save the new state
    this.initialDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
  
    // Force document update with a longer delay to ensure image is ready
    setTimeout(() => {
      this._documentRegenerated$.next(true);
      console.log('Document regeneration triggered after callsheet insertion');
    }, 200); // Increased delay to 200ms
  }

  hasCallsheet(): boolean {
    if (!this.finalDocument?.data || this.finalDocument.data.length === 0) {
      return false;
    }
    
    const firstPage = this.finalDocument.data[0];
    return Array.isArray(firstPage) && 
           firstPage.length > 0 && 
           firstPage[0] && 
           firstPage[0].type === 'callsheet';
  }
  
  // Update the removeCallsheetFromStart method
  removeCallsheetFromStart(): void {
    if (!this.finalDocument || !this.finalDocument.data || this.finalDocument.data.length === 0) {
      console.warn('No document available or document is empty');
      return;
    }
  
    // Check if first page is a callsheet
    if (!this.hasCallsheet()) {
      console.log('No callsheet found at start of document');
      return;
    }
  
    console.log('Removing callsheet from start of document');
    
    // Record the current document state for undo
    const currentDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
    this.undoService.recordDocumentReorderChange(
      currentDocumentState,
      `Remove callsheet from start`
    );
  
    // Remove the callsheet page
    this.finalDocument.data.shift();
  
    // Reindex all remaining pages
    for (let i = 0; i < this.finalDocument.data.length; i++) {
      const page = this.finalDocument.data[i];
      
      if (Array.isArray(page)) {
        page.forEach((line, lineIndex) => {
          if (line) {
            // Update document-wide indexes
            line.docPageIndex = i;
            line.docPageLineIndex = lineIndex;
            
            // Update page numbers
            if (line.category === 'page-number') {
              line.text = (i + 1).toString();
            }
          }
        });
      }
    }
  
    // Update document state
    this.finalDocument.numPages = this.finalDocument.data.length;
  
    // Clear callsheet metadata
    if (this.finalDocument.callsheetMetadata) {
      delete this.finalDocument.callsheetMetadata;
    }
  
    // Save the new state
    this.initialDocumentState = JSON.parse(JSON.stringify(this.finalDocument));
  
    console.log('Callsheet removed successfully. New document structure:', {
      totalPages: this.finalDocument.data.length
    });
  
    // Trigger document update
    this._documentRegenerated$.next(true);
  }
  
  // Helper method to get callsheet metadata
  getCallsheetMetadata(): any {
    return this.finalDocument?.callsheetMetadata || null;
  }

}