import { Component, Input, OnInit  } from '@angular/core';
import { Line } from 'src/app/types/Line';

@Component({
  selector: 'app-last-looks',
  templateUrl: './last-looks.component.html',
  styleUrls: ['./last-looks.component.css'],
})
export class LastLooksComponent implements OnInit{
  @Input() doc: any;
  pages: [];
  currentPageIndex: number = 0;
  currentPage: number = 0
  ngOnInit() {
    this.pages = this.doc.data;
    alert("firing ")
    this.processLinesForLastLooks(this.pages)
    this.updateDisplayedPage()
  }
  updateDisplayedPage() {
    this.currentPage = this.pages[this.currentPageIndex]
  }
  previousPage() {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      this.updateDisplayedPage()
    }
  }
  
  nextPage() {
    if (this.currentPageIndex < this.pages.length) {
      this.currentPageIndex++;  
      this.updateDisplayedPage();

}
  }
 
  processLinesForLastLooks(arr) {
    for(let page of arr) {
      page.forEach((line:Line) => {
        // Perform your calculations and store the results in each line object
        line.calculatedXpos = Number(line.xPos) * 1.3 + 'px';
        
        line.calculatedYpos = Number(line.yPos) > 1 ? Number(line.yPos) * 1.3 + 'px' : '0';
        line.calculatedEnd = Number(line.endY) > 90 ? Number(line.endY) * 1.3 + 'px' : '90px';
        // ... other calculations
      });
    }
  }
}

