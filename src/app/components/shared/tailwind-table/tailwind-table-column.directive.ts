import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appTailwindTableColumn]',
  standalone: false
})
export class TailwindTableColumnDirective {
  @Input() header!: string;
  @Input() field!: string;
  @Input() width: string = 'auto';

  constructor(public template: TemplateRef<any>) {}
} 