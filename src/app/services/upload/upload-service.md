# UploadService Documentation

## Core Responsibilities
1. Script Upload & Processing
2. Call Sheet Management
3. PDF Generation & Subscription Handling
4. State Management for Script Data

## Data Flow

### 1. Initial Script Upload
```mermaid
sequenceDiagram
    participant Client
    participant UploadService
    participant Server
    participant State

    Client->>UploadService: postFile(fileToUpload)
    UploadService->>State: Save filename to localStorage
    UploadService->>Server: POST /api with FormData
    Server-->>UploadService: Return processed data
    UploadService->>State: Store in service properties:
    Note over State: - allLines
    Note over State: - firstAndLastLinesOfScenes
    Note over State: - individualPages
    Note over State: - allChars
    Note over State: - title
    Note over State: - lineCount
```

### 2. Script Processing Flow
The service maintains several key pieces of state after processing:
- `allLines`: Complete script line data
- `individualPages`: Script broken into pages
- `allChars`: Character tracking
- `firstAndLastLinesOfScenes`: Scene boundary tracking
- `lineCount`: Line counts per page

### 3. PDF Generation Flow
```mermaid
sequenceDiagram
    participant Component
    participant UploadService
    participant Auth
    participant Server
    participant Stripe

    Component->>UploadService: generatePdf(finalDocument)
    UploadService->>Auth: Get Firebase token
    UploadService->>Server: POST /pdf with auth
    alt No Subscription
        Server-->>UploadService: 403 + checkoutUrl
        UploadService->>Stripe: Open checkout popup
        Stripe-->>UploadService: Subscription complete
        UploadService->>Server: Retry PDF generation
    else Has Subscription
        Server-->>UploadService: PDF Response
    end
```

## Key Methods

### `postFile(fileToUpload: File)`
Primary method for uploading and processing scripts:
- Creates FormData with script file
- Sends to server for processing
- Stores processed data in service state
- Returns Observable with processed data

### `generatePdf(finalDocument)`
Handles PDF generation with subscription checks:
- Authenticates request with Firebase token
- Handles subscription redirects if needed
- Manages Stripe checkout popup flow
- Returns Observable with PDF generation response

### `postCallSheet(fileToUpload: File)`
Manages call sheet uploads:
- Separate flow from main script upload
- Stores call sheet state
- Returns Observable with call sheet response

### `handleSubscriptionFlow()`
Manages subscription process:
- Opens Stripe checkout in popup
- Monitors popup state
- Verifies subscription completion
- Retries PDF generation after successful subscription

## Error Handling
- Comprehensive error handling through `handleError` method
- Custom error messages for different scenarios:
  - Network issues
  - Authentication errors
  - Permission issues
  - Server errors

## State Management
The service maintains several important state properties:
```typescript
script: string;                     // Current script name
allLines: Line[];                   // All script lines
lineCount: any[];                   // Lines per page
individualPages: any[];             // Page breakdown
allChars: any[];                   // Character data
firstAndLastLinesOfScenes: any[];   // Scene boundaries
title: string;                      // Script title
coverSheet: any;                    // Call sheet data
```

## Integration Points
1. **Authentication**
   - Firebase authentication integration
   - Token management for requests

2. **Server Endpoints**
   - `/api` - Script processing
   - `/pdf` - PDF generation
   - `/callsheet` - Call sheet upload
   - `/delete` - Document deletion

3. **Subscription Management**
   - Stripe integration
   - Subscription status checking
   - Checkout flow handling

## Usage Example
```typescript
// In a component
constructor(private uploadService: UploadService) {}

async handleFileUpload(event: any) {
  const file: File = event.target.files[0];
  
  this.uploadService.postFile(file).subscribe({
    next: (processedData) => {
      // Handle processed script data
    },
    error: (error) => {
      // Handle upload error
    }
  });
}
```