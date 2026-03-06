export interface StorageService {
  uploadFile(path: string, file: File): Promise<string>;
  getFileUrl(path: string): Promise<string>;
}
