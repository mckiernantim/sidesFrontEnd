import { first } from 'rxjs/operators';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LineOutService {
  constructor() {}
  makeX(doc) {
    let falseArr = [];
    doc.data.forEach((page) => {
      falseArr.push(page.filter((line) => line.visible == 'false'));
    });
    let blocks = [];
    let firstX = 0;
    let firstPos;
    let lastX;
    let lastPos;
    let page;
    let falsePage;
    for (let i = 0; i < doc.data.length; i++) {
      let page = doc.data[i];
      //  loop through and find the Start and end bars for each page
      if (falseArr[i].length > 0) {
        falsePage = falseArr[i];
        for (let j = 0; j < falseArr[i].length; j++) {
          if (j == 0) {
            let ind = falseArr[i][0].index;
            firstX = falsePage.filter((line) => line.index == ind)[0].index;
            firstPos = falsePage.filter((line) => line.index == ind)[0].yPos;
          }
          // assign a new firstX if we dont have one
          else if (firstX == 0) {
            let ind = falseArr[i][j].index;
            firstX = falsePage.filter((line) => line.index == ind)[0].index;
            firstPos = falsePage.filter((line) => line.index == ind)[0].yPos;
          } else if (
            // check to see if we have a break and need to make an Endx
            falsePage[j + 1] &&
            falsePage[j + 1].index > falsePage[j].index + 1
          ) {
            lastX = falsePage[j].index;
            lastPos = falsePage[j].yPos;
            blocks.push({
              first: firstX,
              firstPos: firstPos,
              last: lastX,
              lastPos: lastPos,
              page: falsePage[j].page,
            });
            firstX = 0;
            lastX = 0;
            (firstPos = 0), (lastPos = 0);
          }
          // if we run out of lines we know we're at the end
          else if (
            j == falsePage.length - 1 &&
            (lastX == undefined || lastX == 0)
          ) {
            lastX = falsePage[j].index;
            lastPos = falsePage[j].yPos;

            blocks.push({
              first: firstX,
              firstPos: firstPos,
              last: lastX,
              lastPos: lastPos,
              page: falsePage[j].page,
            });
            lastX = 0;
            firstX = 0;
            firstPos = 0;
            lastPos = 0;
          }
        }
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      let pageIndex = blocks[i].page;
      let first = blocks[i].first;
      let firstPos = blocks[i].firstPos;
      let lastPos = blocks[i].lastPos;
      for (let j = 0; j < doc.data.length; j++) {
        if (doc.data[j][0].page == pageIndex) {
          let page = doc.data[j];
          //  index of line that starts the X
          let ind = page.filter((line) => line.index == first)[0];

          // let y = doc.data[i].filter(ind => ind.index  == target)[0].index

          page[page.indexOf(ind)].startX = 'startX';
          // last lines often show up as page-number-hiddens.  By subtracting 1 we should be good
          page[page.indexOf(ind)].block = firstPos - lastPos;
          page[page.indexOf(ind)].blockY =
            firstPos - page[page.indexOf(ind)].block;
          page[page.indexOf(ind)].angle = 90;

          // let x = page.filter(ind => ind.index  == target)[0].index
          // page[page.indexOf(target)].endX = "endX"
        }
      }
    }

    return doc;
  }
}
