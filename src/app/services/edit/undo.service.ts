// undo.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Line } from 'src/app/types/Line';
interface QueueItem {
  pageIndex:number;
  line:Line
}
@Injectable({
  providedIn: 'root',
})
export class UndoService {
  public undoQueue: QueueItem[] = [];
  private undoQueueSource = new Subject<QueueItem>();
  // this is set in our last-looks-component
  public currentPageIndex:number; 
  undoQueue$ = this.undoQueueSource.asObservable();

  addToUndoQueue(line:Line) {
    const changeToAdd: QueueItem = {
      pageIndex:this.currentPageIndex,
      line,
    }
    this.undoQueue.push(changeToAdd);
    console.log(changeToAdd)
    console.log("undo queue added", this.undoQueue)
  }

  undo() {
    if (this.undoQueue.length > 0) {
     const last =  this.undoQueue.pop();
      this.notifyUndoQueueChange(last);
    }
  }
  resetQueue() {
    this.undoQueue = [];
  }
  private notifyUndoQueueChange(val:QueueItem) {
    this.undoQueueSource.next(val);
  }

}

