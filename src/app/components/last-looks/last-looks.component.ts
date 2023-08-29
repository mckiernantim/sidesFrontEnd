import { Component, Input, OnInit } from '@angular/core';
import { Line } from 'src/app/types/Line';

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
})
export class LastLooksComponent implements OnInit {

  @Input() doc: any;
  pages: [];
  pageOptions = ["moveY", "moveX", "toggleHidden", "select"]
  currentPageIndex: number = 0;
  currentPage: number = 0;
  staartingLinesOfDoc = [];
  ngOnInit() {
    this.pages = this.doc.data;
    alert('firing ');
    this.processLinesForLastLooks(this.pages);
    this.updateDisplayedPage();
  }
  processLinesForLastLooks(arr) {
    for (let page of arr) {
      page.forEach((line: Line) => {
        this.adjustSceneNumberPosition(line);
        this.checkForContraction(line);
        this.adjustStartingLinesOfDoc(line);
        this.adjustSceneHeader(line);
        this.adjustEndAndContinue(line);
        this.adjustBarPosition(line);
        this.calculateYPositions(line);
        // Perform your calculations and store the results in each line object
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
        line.calculatedEnd = Number(line.endY) > 90 ? Number(line.endY) * 1.3 + 'px' : '90px';
        // ... other calculations
      });
    }
  }
  updateDisplayedPage() {
    this.currentPage = this.pages[this.currentPageIndex];
  }

  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateDisplayedPage();
    }
  }
  startSingle = function (barY) {
    return barY * 1.3 - 44 + 'px';
  };
  formatEndY = function (endY) {
    if (endY > 90) {
      return endY + 'px';
    } else return 90 + 'px';
  };
  nextPage() {
    if (this.currentPageIndex < this.pages.length) {
      this.currentPageIndex++;
      this.updateDisplayedPage();
    }
  }
  adjustSceneNumberPosition(line: Line) {
    if ((line.category === "scene-number-left" || line.category === "scene-number-right") && line.trueScene === "true-scene") {
      line.calculatedYpos = line.yPos - 10;
    }
  }
  
  checkForContraction(line: Line) {
    if (line.subCategory === "CON'T") {
      console.log("changing " + line.text + " visibility");
      line.visible = "true";
    }
  }
  
  adjustStartingLinesOfDoc(line: Line) {
    if (line.bar === "bar" && !this.staartingLinesOfDoc.includes(line.sceneIndex) && line.sceneIndex > 0) {
      this.staartingLinesOfDoc.push(line.sceneIndex);
    } else {
      line.bar = "hideBar";
    }
  }
  
  adjustSceneHeader(line: Line) {
    if (line.category === "scene-header" && line.visible === "true") {
      line.trueScene = "true-scene";
    }
  }
  
  adjustEndAndContinue(line: Line) {
    if (line.end === "END" && this.staartingLinesOfDoc.includes(line.sceneIndex)) {
      line.endY = line.yPos - 5;
      line.hideCont = "hideCont";
      line.bar = "hideBar";
    } else if (line.cont && line.cont !== "hideCont" && this.staartingLinesOfDoc.includes(line.sceneIndex)) {
      line.hideEnd = "hideEnd";
      line.bar = "hideBar";
    } else {
      line.hideEnd = "hideEnd";
      line.hideCont = "hideCont";
      line.bar = "hideBar";
    }
  }
  
  adjustBarPosition(line: Line) {
    if (line.bar) {
      line.barY = line.yPos + 65;
    }
  }
  
  calculateYPositions(line: Line) {
    line.calculatedYpos = Number(line.yPos) > 1 ? Number(line.yPos) * 1.3 + 'px' : '0';
  }
    
          

  updatePositionsInDocument(arr) {
    for (let page of arr) {
      page.forEach((line: Line) => {
        if (line.calculatedXpos) {
          line.xPos = (Number(line.calculatedXpos) / 1.3) ;
        }
        if (line.calculatedYpos) {
          line.yPos = (Number(line.calculatedYpos) / 1.3) ;
        }
        // Update other properties if needed
      });
    }
  }
}
