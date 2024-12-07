import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Line } from 'src/app/types/Line';
import { cloneDeep } from 'lodash';
interface StackItem {
  pageIndex: number;
  line: Line;
}

@Injectable({
  providedIn: 'root',
})
export class UndoService {
  private undoStack: StackItem[] = [];
  private undoStackSource = new BehaviorSubject<StackItem | null>(null);
  // This is set in our last-looks-component
  public currentPageIndex: number; 
  undoStack$ = this.undoStackSource.asObservable();

  push(item:StackItem) {
    const { pageIndex, line} = item
    let changeToRecord = {
      pageIndex,
      line: cloneDeep(line)
    }
    this.undoStack.push(changeToRecord);
  }

  pop() {
    if (this.undoStack.length > 0) {
      const last = this.undoStack.pop();
      this.notifyUndoStackChange(last);
    }
  }

  reset() {
    this.undoStack = [];
  }

  private notifyUndoStackChange(val: StackItem | null) {
    this.undoStackSource.next(val);
  }
  
}

