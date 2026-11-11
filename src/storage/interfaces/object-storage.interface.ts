export interface CreatePresignedUploadUrlInput {
  key: string;
  expiresInSeconds: number;
  contentType?: string;
  contentLength?: number;
}

export interface StoredObjectMetadata {
  contentLength: number | undefined;
  contentType: string | undefined;
  etag: string | undefined;
  checksumSha256: string | undefined;
  lastModified: Date | undefined;
}

export interface ObjectStorage {
  createPresignedUploadUrl(
    input: CreatePresignedUploadUrlInput,
  ): Promise<string>;

  getObjectMetadata(key: string): Promise<StoredObjectMetadata | null>;

  deleteObject(key: string): Promise<void>;
}
