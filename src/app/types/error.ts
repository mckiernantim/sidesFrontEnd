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

export const ErrorCodeMessages: Record<string, string> = {
  'VALIDATION_ERROR': 'The provided data is invalid.',
  'AUTHENTICATION_ERROR': 'Authentication failed. Please sign in again.',
  'AUTHORIZATION_ERROR': 'You don\'t have permission to perform this action.',
  'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
  'SUBSCRIPTION_ERROR': 'There was an issue with your subscription.',
  'PDF_GENERATION_ERROR': 'Failed to generate the PDF document.',
  'SCAN_ERROR': 'Failed to scan the document.',
  'CLASSIFICATION_ERROR': 'Failed to classify the document content.',
  'WORKER_ERROR': 'A processing error occurred.',
  'TIMEOUT_ERROR': 'The operation timed out. Please try again.',
  'FILE_SYSTEM_ERROR': 'Failed to access or save the file.',
  'UNSUPPORTED_FORMAT': 'The file format is not supported.',
  'INTERNAL_ERROR': 'An internal server error occurred.'
}; 