import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TailwindTableColumnDirective } from './tailwind-table-column.directive';

// Define the column interface to match what you're using
export interface TableColumn {
  key: string;
  header: string;
  cell?: (item: any) => string;
}

@Component({
  selector: 'app-tailwind-table',
  templateUrl: './tailwind-table.component.html',
  styleUrls: ['./tailwind-table.component.css'],
  standalone: false
})
export class TailwindTableComponent implements AfterContentInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: {key: string, header: string, cell?: (item: any) => string}[] = [];
  @Input() selectable: boolean = false;
  @Input() pagination: boolean = false;
  @Input() pageSize: number = 10;
  @Input() selectedItems: any[] = [];
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();
  
  @ContentChildren(TailwindTableColumnDirective) columnList!: QueryList<TailwindTableColumnDirective>;
  
  currentPage: number = 1;
  totalPages: number = 1;
  displayData: any[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // For template access
  Math = Math;
  
  ngAfterContentInit() {
    // Only use columnList if columns input is empty
    if (this.columns.length === 0 && this.columnList && this.columnList.length > 0) {
      this.columns = this.columnList.toArray().map(col => ({
        key: col.key,
        header: col.header,
        cell: col.cell
      }));
    }
    
    // Initialize the display data
    this.updateDisplayData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    // Update display data when inputs change
    if (changes.data || changes.pagination || changes.pageSize || changes.sortColumn || changes.sortDirection) {
      this.updateDisplayData();
    }
  }
  
  setupPagination(): void {
    if (this.pagination && this.data) {
      this.totalPages = Math.max(1, Math.ceil(this.data.length / this.pageSize));
      
      // Ensure current page is valid
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
      
      // Update display data
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, this.data.length);
      this.displayData = this.data.slice(start, end);
    } else {
      this.displayData = this.data ? [...this.data] : [];
      this.totalPages = 1;
      this.currentPage = 1;
    }
  }
  
  get sortedData(): any[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }
    
    let result = [...this.data];
    
    // Apply sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        const valueA = a[this.sortColumn];
        const valueB = b[this.sortColumn];
        
        // Handle undefined or null values
        if (valueA === undefined || valueA === null) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueB === undefined || valueB === null) return this.sortDirection === 'asc' ? 1 : -1;
        
        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return this.sortDirection === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // Handle number comparison
        const comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    // Apply pagination
    if (this.pagination) {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = Math.min(start + this.pageSize, result.length);
      return result.slice(start, end);
    }
    
    return result;
  }
  
  get startIndex(): number {
    return this.currentPage * this.pageSize;
  }
  
  get endIndex(): number {
    return this.startIndex + this.pageSize;
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
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.updateDisplayData();
    this.pageChange.emit(page);
  }
  
  isSelected(item: any): boolean {
    return this.selectedItems.some(selected => 
      selected.index === item.index || selected.id === item.id
    );
  }
  
  toggleSelection(event: Event, item: any): void {
    event.stopPropagation();
    
    const index = this.selectedItems.findIndex(selected => 
      selected.index === item.index || selected.id === item.id
    );
    
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
    
    this.selectionChange.emit(this.selectedItems);
  }
  
  onRowClick(item: any): void {
    this.rowClick.emit(item);
  }
  
  updateDisplayData(): void {
    this.setupPagination();
  }
} 