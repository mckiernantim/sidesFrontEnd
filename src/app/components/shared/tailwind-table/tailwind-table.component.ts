import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TailwindTableColumnDirective } from './tailwind-table-column.directive';

@Component({
  selector: 'app-tailwind-table',
  templateUrl: './tailwind-table.component.html',
  styleUrls: ['./tailwind-table.component.css'],
  standalone: false
})
export class TailwindTableComponent implements AfterContentInit {
  @Input() data: any[] = [];
  @Input() showActions: boolean = false;
  @Input() showPagination: boolean = false;
  @Input() pageSize: number = 10;
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  
  @ContentChildren(TailwindTableColumnDirective) columnList!: QueryList<TailwindTableColumnDirective>;
  
  columns: TailwindTableColumnDirective[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 0;
  
  // For template access
  Math = Math;
  
  ngAfterContentInit() {
    this.columns = this.columnList.toArray();
  }
  
  get sortedData(): any[] {
    let result = [...this.data];
    
    // Apply sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
        
        if (valueA === valueB) return 0;
        
        const comparison = valueA < valueB ? -1 : 1;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    // Apply pagination
    if (this.showPagination) {
      return result.slice(this.startIndex, this.endIndex);
    }
    
    return result;
  }
  
  get startIndex(): number {
    return this.currentPage * this.pageSize;
  }
  
  get endIndex(): number {
    return this.startIndex + this.pageSize;
  }
  
  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize);
  }
  
  get pageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 0; i < this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with current page in the middle
      let startPage = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages - 1, startPage + maxVisiblePages - 1);
      
      // Adjust if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }
  
  sort(column: string) {
    if (this.sortColumn === column) {
      // Toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  goToPage(page: number) {
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }
} 