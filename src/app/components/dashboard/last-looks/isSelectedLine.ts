import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isSelectedLine'
})
export class IsSelectedLinePipe implements PipeTransform {
  transform(selectedLine: any, line: any): boolean {
    return selectedLine === line;
  }
}