export const ErrorCodes = {
  // Auth PS-1xx
  INVALID_CREDENTIALS:    { code: 'PS-101', message: 'Invalid email or password' },
  ACCOUNT_NOT_FOUND:      { code: 'PS-102', message: 'Account not found' },
  ACCOUNT_DISABLED:       { code: 'PS-103', message: 'Account has been disabled' },
  SESSION_EXPIRED:        { code: 'PS-104', message: 'Session expired — please log in again' },
  INVALID_TOKEN:          { code: 'PS-105', message: 'Invalid session token' },

  // Authorization PS-2xx
  NOT_LOGGED_IN:          { code: 'PS-201', message: 'You must be logged in' },
  NOT_EVENT_OWNER:        { code: 'PS-202', message: 'You do not have access to this event' },
  EVENT_NOT_FOUND:        { code: 'PS-203', message: 'Event not found' },
  STORAGE_QUOTA_EXCEEDED: { code: 'PS-204', message: 'Storage limit reached — please upgrade your plan' },
  STORAGE_LIMIT_EXCEEDED: { code: 'PS-204', message: 'Storage limit reached — please upgrade your plan' },
  PHOTO_NOT_FOUND:        { code: 'PS-205', message: 'Photo not found' },
  USER_NOT_FOUND:         { code: 'PS-206', message: 'User not found' },
  FORBIDDEN:              { code: 'PS-207', message: 'You do not have permission to do this' },
  FOLDER_NOT_FOUND:       { code: 'PS-208', message: 'Folder not found' },

  // Upload PS-3xx
  INVALID_FILE_TYPE:      { code: 'PS-301', message: 'File type not allowed. Accepted: jpg, png, webp, heic' },
  FILE_TOO_LARGE:         { code: 'PS-302', message: 'File too large. Maximum size is 20MB' },
  IMAGE_TOO_SMALL:        { code: 'PS-303', message: 'Image too small. Minimum size is 100×100 pixels' },
  INVALID_MIME_TYPE:      { code: 'PS-304', message: 'File content does not match its extension' },
  DUPLICATE_PHOTO:        { code: 'PS-305', message: 'This photo already exists in the event' },
  UPLOAD_URL_EXPIRED:     { code: 'PS-306', message: 'Upload session expired — please try again' },
  PHOTO_FLAGGED:          { code: 'PS-307', message: 'Photo added to Pending Review queue' },
  DUPLICATE_FOLDER_NAME:  { code: 'PS-308', message: 'A folder with this name already exists in this event' },

  // Face Matching PS-4xx
  FACE_SEARCH_FAILED:     { code: 'PS-400', message: 'Face search failed — please try again' },
  NO_FACE_IN_SELFIE:      { code: 'PS-401', message: 'No face detected. Try better lighting and face the camera directly' },
  SELFIE_TOO_BLURRY:      { code: 'PS-402', message: 'Selfie too blurry — please retake in better lighting' },
  MULTIPLE_FACES:         { code: 'PS-403', message: 'Multiple faces detected — please upload a solo photo' },
  EVENT_NO_PHOTOS:        { code: 'PS-404', message: 'This event has no photos uploaded yet' },
  NO_MATCHES_FOUND:       { code: 'PS-405', message: 'No matching photos found — try a different selfie' },
  EVENT_CLOSED:           { code: 'PS-406', message: 'This event is closed' },

  // System PS-5xx
  SERVER_ERROR:           { code: 'PS-500', message: 'Something went wrong — our team has been notified' },
  DB_ERROR:               { code: 'PS-501', message: 'Database error' },
  S3_ERROR:               { code: 'PS-502', message: 'Storage service unavailable' },
  REKOGNITION_ERROR:      { code: 'PS-503', message: 'AI service temporarily unavailable' },
} as const
