/**
 * Unified TypeScript interfaces for the Document Chat System AI document management system.
 *
 * MAJOR CONSOLIDATION (2025-07-28): Eliminated 14+ redundant models
 * - Consolidated all document-related models into JSON fields
 * - Unified enums for seamless DB-to-UI data flow
 * - Single source of truth for all document data
 * - Zero transformations needed between layers
 */

// ==========================================
// UNIFIED ENUMS (DB + TypeScript Compatible)
// ==========================================

// Document processing status
export enum ProcessingStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Document classification types
export enum DocumentType {
  PROPOSAL = 'PROPOSAL',
  CONTRACT = 'CONTRACT',
  SOLICITATION = 'SOLICITATION',
  AMENDMENT = 'AMENDMENT',
  CERTIFICATION = 'CERTIFICATION',
  CAPABILITY_STATEMENT = 'CAPABILITY_STATEMENT',
  PAST_PERFORMANCE = 'PAST_PERFORMANCE',
  COMPLIANCE = 'COMPLIANCE',
  TEMPLATE = 'TEMPLATE',
  OTHER = 'OTHER',
}

// Contract-specific types (separate from DocumentType)
export enum ContractType {
  FIXED_PRICE = 'FIXED_PRICE',
  COST_PLUS = 'COST_PLUS',
  TIME_AND_MATERIALS = 'TIME_AND_MATERIALS',
  RETAINER = 'RETAINER',
  MILESTONE_BASED = 'MILESTONE_BASED',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PERFORMANCE_BASED = 'PERFORMANCE_BASED',
  FRAMEWORK_AGREEMENT = 'FRAMEWORK_AGREEMENT',
  MASTER_SERVICE_AGREEMENT = 'MASTER_SERVICE_AGREEMENT',
  OTHER = 'OTHER',
}

// Workflow status
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

// Security classification
export enum SecurityClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
}

// Entity types for extraction
export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  DATE = 'DATE',
  MONEY = 'MONEY',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  ADDRESS = 'ADDRESS',
  CONTRACT_NUMBER = 'CONTRACT_NUMBER',
  NAICS_CODE = 'NAICS_CODE',
  CERTIFICATION = 'CERTIFICATION',
  DEADLINE = 'DEADLINE',
  REQUIREMENT = 'REQUIREMENT',
  MISC = 'MISC',
}

// Permission types
export enum PermissionType {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  SHARE = 'SHARE',
  COMMENT = 'COMMENT',
}

// Comment/workflow types
export enum CommentType {
  COMMENT = 'COMMENT',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
  QUESTION = 'QUESTION',
  SUGGESTION = 'SUGGESTION',
}

// Compliance status
export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  UNKNOWN = 'UNKNOWN',
}

// Processing event types
export enum ProcessingEventType {
  UPLOAD = 'UPLOAD',
  TEXT_EXTRACTION = 'TEXT_EXTRACTION',
  SECTION_ANALYSIS = 'SECTION_ANALYSIS',
  ENTITY_EXTRACTION = 'ENTITY_EXTRACTION',
  CONTENT_ANALYSIS = 'CONTENT_ANALYSIS',
  SECURITY_ANALYSIS = 'SECURITY_ANALYSIS',
  CONTRACT_ANALYSIS = 'CONTRACT_ANALYSIS',
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK',
  VECTORIZATION = 'VECTORIZATION',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ==========================================
// CORE DOCUMENT INTERFACE (UNIFIED)
// ==========================================

export interface Document {
  // Core fields (direct DB mapping)
  id: string
  organizationId: string
  uploadedById: string
  folderId: string | null

  // File information
  name: string // User-editable filename
  size: number
  mimeType: string
  filePath: string
  uploadDate: string // ISO string
  lastModified: string // ISO string
  
  // Computed fields
  type: string // Computed file type (pdf, md, etc.)

  // Document classification (unified enums)
  documentType: DocumentType
  securityClassification: SecurityClassification
  workflowStatus: WorkflowStatus

  // Extracted content
  extractedText: string
  summary: string

  // User metadata
  description: string | null
  tags: string[]
  setAsideType: string | null
  naicsCodes: string[]
  isEditable: boolean

  // JSON fields (consolidated data)
  content: DocumentContent
  embeddings: DocumentEmbeddings
  entities: DocumentEntities
  sharing: DocumentSharing // Now includes comments
  revisions: DocumentRevisions
  processing: DocumentProcessing // Contains current status + history
  analysis: DocumentAnalysis

  // Timestamps
  createdAt: string // ISO string
  updatedAt: string // ISO string
  deletedAt: string | null // ISO string

  // Client-side only
  originalFile?: File
}

// ==========================================
// FOLDER INTERFACE (UPDATED)
// ==========================================

export interface Folder {
  id: string
  name: string
  description: string | null
  parentId: string | null
  color: string | null
  organizationId: string
  createdById: string

  // Hierarchy
  path: string[]
  level: number

  // Folder properties
  icon: string | null
  folderType: string | null
  isSystemFolder: boolean
  isPublic: boolean
  isProtected: boolean

  // Metadata
  metadata: any | null

  // Timestamps
  createdAt: string // ISO string
  updatedAt: string // ISO string
  deletedAt: string | null // ISO string
}

// ==========================================
// CONSOLIDATED JSON INTERFACES (UNIFIED)
// ==========================================

export interface DocumentContent {
  // AI-generated content summaries and insights
  summary?: string
  keywords?: string[]
  keyPoints?: string[]
  actionItems?: string[]
  questions?: string[]

  sections: {
    id: string
    title: string
    content: string
    pageNumber: number | null
    sectionOrder: number
    sectionType: string
    parentId: string | null
    level: number
  }[]

  tables: {
    id: string
    headers: string[]
    rows: string[][]
    pageNumber: number | null
    tableOrder: number
    caption: string | null
    rowCount: number
    columnCount: number
  }[]

  images: {
    id: string
    description: string | null
    altText: string | null
    imageType: string | null
    pageNumber: number | null
    imageOrder: number
    filePath: string
    mimeType: string
    width: number | null
    height: number | null
    extractedText: string | null
    extractedData: any | null
    boundingBox: any | null
    fileSize: number | null
    quality: string | null
    isOcrProcessed: boolean
  }[]
}

export interface DocumentEmbeddings {
  // Document identification
  documentId: string // Reference to the source document
  documentTitle: string // Human-readable document name
  organizationNamespace: string // Unique organization identifier (business name or organizationId)
  
  // Chunk references - minimal data stored in DB
  chunks: {
    id: string // Unique chunk ID (e.g., "doc123_chunk_0")
    chunkIndex: number // Sequential chunk number
    vectorId: string // Pinecone vector ID reference
    
    // Text position for attribution
    startChar: number // Start position in original text
    endChar: number // End position in original text
    
    // Optional: Key terms for hybrid search
    keywords?: string[] // Main keywords from this chunk
  }[]
  
  // Processing metadata
  model: string // Embedding model used (e.g., "text-embedding-3-small")
  dimensions: number // Vector dimensions (e.g., 1536)
  totalChunks: number // Total number of chunks
  lastProcessed: string // ISO string - when embeddings were generated
}

// Extracted entity interface for AI services (compatible with DB schema)
export interface ExtractedEntity {
  text: string
  type: EntityType
  confidence: number
  startOffset: number
  endOffset: number
  context?: string | null
  originalAIType?: string // Store AI's original type for proper conversion
}

export interface DocumentEntities {
  entities: {
    id: string
    text: string
    type: EntityType // Unified enum
    confidence: number
    startOffset: number
    endOffset: number
    context: string | null
    metadata: any | null
  }[]
  extractedAt?: string
  totalCount?: number
}

export interface DocumentSharing {
  permissions: {
    id: string
    userId: string
    permission: PermissionType // Unified enum
    grantedBy: string
    grantedAt: string // ISO string
    expiresAt: string | null // ISO string
    isPublic: boolean
    inheritFromParent: boolean
  }[]

  share: {
    id: string
    shareUrl: string
    shareToken: string
    isShared: boolean
    expiresAt: string | null // ISO string
    password: string | null
    allowDownload: boolean
    allowPreview: boolean
    trackViews: boolean
    viewCount: number
    lastViewedAt: string | null // ISO string
    sharedBy: string
    sharedAt: string // ISO string
  } | null

  shareViews: {
    id: string
    viewedAt: string // ISO string
    ipAddress: string | null
    userAgent: string | null
    referrer: string | null
    sessionId: string | null
  }[]

  comments: {
    id: string
    userId: string
    userName: string
    comment: string
    type: CommentType // Unified enum
    parentId: string | null
    isResolved: boolean
    resolvedAt: string | null // ISO string
    resolvedBy: string | null
    createdAt: string // ISO string
    updatedAt: string // ISO string
  }[]
}

export interface DocumentRevisions {
  revisions: {
    id: string
    version: string
    name: string
    size: number
    filePath: string
    mimeType: string
    changeLog: string | null
    isActive: boolean
    createdAt: string // ISO string
    createdBy: string
    metadata: any | null
  }[]
}

export interface DocumentProcessing {
  // Current processing state (single source of truth)
  currentStatus: ProcessingStatus
  progress: number // 0-100
  currentStep: string | null
  estimatedCompletion: string | null // ISO string

  // Historical processing events
  events: {
    id: string
    userId: string | null
    event: string
    eventType: ProcessingEventType // Unified enum
    success: boolean
    error: string | null
    timestamp: string // ISO string
    duration: number | null // milliseconds
    metadata: any | null
  }[]
}

export interface DocumentAnalysis {
  // Document quality and readability scores
  qualityScore?: number // 0-100
  readabilityScore?: number // 0-100
  confidence?: number // 0-1
  sentiment?: string

  // AI-extracted entities
  entities?: ExtractedEntity[]

  // Complexity metrics
  complexityMetrics?: {
    readabilityScore: number
  }

  // Security analysis results
  security?: {
    classification: SecurityClassification
    confidenceScore: number
    sensitiveDataDetected?: boolean
    recommendations?: string[]
  }

  // AI suggestions and recommendations
  suggestions?: string[]

  contract: {
    id: string
    contractType: ContractType // Unified enum (not DocumentType)
    estimatedValue: string | null
    timeline: string | null
    requirements: string[]
    risks: string[]
    opportunities: string[]
    keyTerms: string[]
    deadlines: any[] | null
    parties: string[]
    createdAt: string // ISO string
    updatedAt: string // ISO string
  } | null

  compliance: {
    id: string
    status: ComplianceStatus // Unified enum
    issues: string[]
    recommendations: string[]
    checkVersion: string
    checkType: string
    complianceScore: number | null
    lastCheckedAt: string // ISO string
    createdAt: string // ISO string
    updatedAt: string // ISO string
  } | null
}

// Contract Analysis Interface
export interface ContractAnalysis {
  contractType: string
  estimatedValue?: string
  timeline?: string
  deadlines?: string[] // UI expects deadlines as array
  requirements: string[]
  risks: string[]
  opportunities: string[]
}

// ==========================================
// INPUT INTERFACES (UNIFIED)
// ==========================================

export interface DocumentCreateInput {
  file: File
  folderId: string | null
  organizationId: string

  // Optional overrides (using unified enums)
  name?: string
  documentType?: DocumentType
  securityClassification?: SecurityClassification
  workflowStatus?: WorkflowStatus
  description?: string
  tags?: string[]
  setAsideType?: string
  naicsCodes?: string[]
  autoProcess?: boolean
}

export interface DocumentUpdateInput {
  // All Document fields can be updated (using unified enums)
  name?: string
  folderId?: string | null
  documentType?: DocumentType
  securityClassification?: SecurityClassification
  workflowStatus?: WorkflowStatus
  extractedText?: string
  summary?: string
  description?: string | null
  tags?: string[]
  setAsideType?: string | null
  naicsCodes?: string[]
  isEditable?: boolean

  // JSON field updates
  content?: DocumentContent
  embeddings?: DocumentEmbeddings
  entities?: DocumentEntities
  sharing?: DocumentSharing
  revisions?: DocumentRevisions
  processing?: DocumentProcessing
  analysis?: DocumentAnalysis
}

export interface FolderCreateInput {
  name: string
  parentId: string | null
  organizationId: string
  description?: string
  color?: string
  icon?: string
  folderType?: string
}

export interface FolderUpdateInput {
  name?: string
  description?: string | null
  color?: string | null
  parentId?: string | null
  icon?: string | null
  folderType?: string | null
  isPublic?: boolean
  metadata?: any
}

// ==========================================
// OPERATION RESULT INTERFACES
// ==========================================

export interface TreeOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  operation: string
  timestamp: string
  details?: Record<string, any>
}

export interface TreeOperationLog {
  id: string
  operation: string
  entityType: 'folder' | 'document'
  entityId: string
  timestamp: string
  success: boolean
  error?: string
  beforeState?: any
  afterState?: any
  metadata?: Record<string, any>
}

// ==========================================
// STATE MANAGEMENT INTERFACES
// ==========================================

export interface DocumentsState {
  folders: Folder[]
  documents: Document[]
  currentFolderId: string | null
  selectedItems: SelectedItems
  loading: boolean
  error: string | null
  operationLogs: TreeOperationLog[]
  searchQuery: string
  searchResults: Document[]
  viewMode: ViewMode
  sortBy: SortOption
  sortDirection: 'asc' | 'desc'
  filters: DocumentFilters
}

export interface SelectedItems {
  documents: string[]
  folders: string[]
}

export type ViewMode = 'grid' | 'list' | 'tree'

export interface SortOption {
  field: 'name' | 'lastModified' | 'size' | 'documentType' | 'uploadDate'
  label: string
}

export interface DocumentFilters {
  types: string[]
  tags: string[]
  dateRange?: {
    start: string
    end: string
  }
  sizeRange?: {
    min: number
    max: number
  }
}

// ==========================================
// ACTION INTERFACES (UPDATED)
// ==========================================

export interface DocumentsActions {
  // State management
  setFolders: (folders: Folder[]) => void
  setDocuments: (documents: Document[]) => void
  setCurrentFolderId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void

  // Folder operations
  loadFolders: () => Promise<TreeOperationResult<Folder[]>>
  createFolder: (
    input: FolderCreateInput
  ) => Promise<TreeOperationResult<Folder>>
  updateFolder: (
    folderId: string,
    updates: FolderUpdateInput
  ) => Promise<TreeOperationResult<Folder>>
  deleteFolder: (folderId: string) => Promise<TreeOperationResult<void>>
  moveFolder: (
    folderId: string,
    newParentId: string | null
  ) => Promise<TreeOperationResult<Folder>>

  // Document operations
  createDocument: (
    input: DocumentCreateInput
  ) => Promise<TreeOperationResult<Document>>
  updateDocument: (
    documentId: string,
    updates: DocumentUpdateInput
  ) => Promise<TreeOperationResult<Document>>
  moveDocument: (
    documentId: string,
    newFolderId: string | null
  ) => Promise<TreeOperationResult<Document>>
  deleteDocument: (documentId: string) => Promise<TreeOperationResult<void>>

  // Navigation and queries
  navigateToFolder: (folderId: string | null) => void
  getFolderChildren: (parentId: string | null) => Folder[]
  getFolderPath: (folderId: string) => Folder[]
  getFolderDocuments: (folderId: string | null) => Document[]
  findFolder: (id: string) => Folder | undefined
  findDocument: (id: string) => Document | undefined

  // Search and filtering
  searchDocuments: (query: string) => Document[]
  setSearchQuery: (query: string) => void
  setSearchResults: (results: Document[]) => void
  clearSearch: () => void
  setFilters: (filters: Partial<DocumentFilters>) => void
  clearFilters: () => void

  // View and selection
  setViewMode: (mode: ViewMode) => void
  setSortBy: (field: SortOption['field'], direction?: 'asc' | 'desc') => void
  selectDocument: (documentId: string) => void
  selectFolder: (folderId: string) => void
  deselectDocument: (documentId: string) => void
  deselectFolder: (folderId: string) => void
  selectAll: () => void
  deselectAll: () => void

  // Bulk operations
  bulkDeleteDocuments: (
    documentIds: string[]
  ) => Promise<TreeOperationResult<void>>
  bulkMoveDocuments: (
    documentIds: string[],
    folderId: string | null
  ) => Promise<TreeOperationResult<void>>
  bulkDeleteFolders: (folderIds: string[]) => Promise<TreeOperationResult<void>>
  bulkMoveFolders: (
    folderIds: string[],
    parentId: string | null
  ) => Promise<TreeOperationResult<void>>

  // Store management
  initializeStore: (data: { folders: Folder[]; documents: Document[] }) => void
  resetStore: () => void
  exportState: () => DocumentsState
  importState: (state: Partial<DocumentsState>) => void
}

// ==========================================
// STORE SLICE INTERFACE
// ==========================================

export interface DocumentsSlice extends DocumentsState, DocumentsActions {
  // Helper methods for internal use
  _createSuccessResult: <T>(
    data: T,
    operation: string
  ) => TreeOperationResult<T>
  _createErrorResult: <T>(
    error: string,
    operation: string
  ) => TreeOperationResult<T>
  _logOperation: (log: TreeOperationLog) => void
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type DocumentOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'copy'
  | 'rename'
  | 'process'

export type FolderOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'copy'
  | 'rename'

export type TreeEntityType = 'document' | 'folder'

export interface TreeEntity {
  id: string
  name: string
  type: TreeEntityType
  parentId?: string | null
  createdAt: string
  updatedAt: string
}

// ==========================================
// CONSTANTS
// ==========================================

export const DOCUMENT_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE: 'move',
  COPY: 'copy',
  RENAME: 'rename',
  PROCESS: 'process',
} as const

export const FOLDER_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE: 'move',
  COPY: 'copy',
  RENAME: 'rename',
} as const

export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
  TREE: 'tree',
} as const

export const SORT_FIELDS = {
  NAME: 'name',
  LAST_MODIFIED: 'lastModified',
  SIZE: 'size',
  DOCUMENT_TYPE: 'documentType',
  UPLOAD_DATE: 'uploadDate',
} as const

// ==========================================
// BACKWARD COMPATIBILITY TYPES
// ==========================================

/**
 * Simple DocumentSection interface for AI services
 * Maps to the more complex DocumentContent.sections structure
 */
export interface DocumentSection {
  title: string
  content: string
  pageNumber?: number | null
}

/**
 * Document table interface for AI services
 */
export interface DocumentTable {
  headers: string[]
  rows: string[][]
  pageNumber?: number | null
  caption?: string | null
}

/**
 * Document image interface for AI services
 */
export interface DocumentImage {
  description?: string | null
  altText?: string | null
  filePath: string
  pageNumber?: number | null
  extractedText?: string | null
}
