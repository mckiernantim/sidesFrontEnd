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
  private undoQueue: QueueItem[] = [];
  private undoQueueSource = new Subject<QueueItem[]>();
  public currentPage:number; 
  undoQueue$ = this.undoQueueSource.asObservable();

  addToUndoQueue(line:Line) {
    const changeToAdd: QueueItem = {
      pageIndex:this.currentPage,
      line,
    }
    this.undoQueue.push(changeToAdd);
    this.notifyUndoQueueChange();
  }

  undo() {
    if (this.undoQueue.length > 0) {
      this.undoQueue.pop();
      this.notifyUndoQueueChange();
    }
  }
  resetQueue() {
    this.undoQueue = [];
  }
  private notifyUndoQueueChange() {
    this.undoQueueSource.next([...this.undoQueue]);
  }
}

