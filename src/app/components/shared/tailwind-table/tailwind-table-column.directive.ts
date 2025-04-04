import { Directive, Input, TemplateRef, Optional } from '@angular/core';

@Directive({
  selector: '[appTailwindTableColumn]',
  standalone: false
})
export class TailwindTableColumnDirective {
  @Input() key: string = '';
  @Input() header: string = '';
  @Input() cell?: (item: any) => string;
  
  constructor(@Optional() public template: TemplateRef<any>) {}
} 