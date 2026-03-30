export interface AppError {
  success: boolean;
  error: {
    message: string;
    code: string;
    status: number;
    details?: any;
    operation?: string;
    timestamp: string;
  };
}

/**
 * Human-readable error messages for each error code
 * These match the backend ErrorMessages in AppError.js
 */
export const ErrorCodeMessages: Record<string, string> = {
  // General errors
  'VALIDATION_ERROR': 'The provided data is invalid. Please check your input and try again.',
  'AUTHENTICATION_ERROR': 'Authentication failed. Please sign in again.',
  'AUTHORIZATION_ERROR': 'You don\'t have permission to perform this action.',
  'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
  'SUBSCRIPTION_ERROR': 'There was an issue with your subscription. Please contact support.',
  'INTERNAL_ERROR': 'An internal server error occurred. Our team has been notified.',
  
  // File upload errors
  'FILE_TOO_LARGE': 'Your file is too large. Please upload a file smaller than 50MB.',
  'FILE_TOO_SMALL': 'Your file appears to be corrupted or empty. Please try a different file.',
  'FILE_NOT_FOUND': 'The file could not be found. Please try uploading again.',
  'INVALID_FILE_TYPE': 'Please upload a PDF file. Other file types are not supported.',
  'CORRUPTED_FILE': 'Your file appears to be corrupted. Please try exporting it again from your screenwriting software.',
  'FILE_UPLOAD_FAILED': 'File upload failed. Please check your connection and try again.',
  
  // PDF specific errors
  'PDF_GENERATION_ERROR': 'Failed to generate your PDF. Please try again.',
  'PDF_INVALID_SIGNATURE': 'This doesn\'t appear to be a valid PDF file. Please upload a PDF.',
  'PDF_PASSWORD_PROTECTED': 'This PDF is password protected. Please remove the password and upload again.',
  'PDF_CORRUPTED': 'This PDF file appears to be corrupted. Try re-exporting from your screenwriting software.',
  'PDF_TOO_MANY_PAGES': 'This PDF has too many pages (maximum 500 pages). Please upload a shorter script.',
  'PDF_UNSUPPORTED_VERSION': 'This PDF version is not supported. Please try re-exporting your script.',
  'PDF_SECURITY_RISK': 'This PDF contains features that could be a security risk. Please export a clean copy from your screenwriting software.',
  
  // Processing errors
  'SCAN_ERROR': 'Failed to scan your document. Please try again or contact support if the issue persists.',
  'CLASSIFICATION_ERROR': 'Failed to analyze your script format. The script may have an unusual layout.',
  'WORKER_ERROR': 'A processing error occurred. Please try uploading again.',
  'TIMEOUT_ERROR': 'The operation took too long and was cancelled. Please try again with a smaller file.',
  'PROCESSING_FAILED': 'Failed to process your script. Please check the format and try again.',
  
  // Cloud Run errors
  'CLOUD_RUN_NOT_CONFIGURED': 'The processing service is temporarily unavailable. Please try again later.',
  'CLOUD_RUN_ERROR': 'An error occurred in the processing service. Please try again.',
  
  // System errors
  'FILE_SYSTEM_ERROR': 'A file system error occurred. Please try again.',
  'MEMORY_LIMIT_EXCEEDED': 'Your file is too complex to process. Please try a simpler script.',
  'SERVER_OVERLOADED': 'Our servers are currently busy. Please wait a moment and try again.',
  
  // Legacy
  'UNSUPPORTED_FORMAT': 'This file format is not supported. Please upload a PDF.'
};

/**
 * Get a user-friendly error message for an error code
 */
export function getUserFriendlyMessage(code: string, fallbackMessage?: string): string {
  return ErrorCodeMessages[code] || fallbackMessage || 'An unexpected error occurred. Please try again.';
} 