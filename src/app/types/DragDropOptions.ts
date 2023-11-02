import { Line } from './Line';

// options object for our DragDrop function
export interface DragDropOptions {
  line: Line;
  event:MouseEvent,
  lineIndex:number,
}
