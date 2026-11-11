import { InputFileType } from '../generated/prisma/client.js';

const CONTENT_TYPES: Record<InputFileType, readonly string[]> = {
  FASTQ: ['application/gzip', 'application/octet-stream', 'text/plain'],
  BAM: ['application/octet-stream'],
  CRAM: ['application/octet-stream'],
  VCF: ['application/octet-stream', 'text/plain', 'application/gzip'],
  GVCF: ['application/octet-stream', 'text/plain', 'application/gzip'],
  BED: ['application/octet-stream', 'text/plain', 'application/gzip'],
  OTHER: ['application/octet-stream'],
};

export function isAllowedContentType(
  fileType: InputFileType,
  contentType: string,
): boolean {
  return CONTENT_TYPES[fileType].includes(contentType);
}

export function defaultContentType(fileType: InputFileType): string {
  return CONTENT_TYPES[fileType][0];
}
