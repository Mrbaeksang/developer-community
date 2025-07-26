import { NextRequest } from 'next/server';

// 파일 업로드 보안 설정
export const FileUploadConfig = {
  // 허용된 이미지 타입
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],
  
  // 허용된 문서 타입
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ],
  
  // 파일 크기 제한
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024,        // 5MB
    DOCUMENT: 10 * 1024 * 1024,    // 10MB
    VIDEO: 100 * 1024 * 1024,      // 100MB
    DEFAULT: 10 * 1024 * 1024      // 10MB
  },
  
  // 위험한 파일 확장자
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.sh', '.ps1',
    '.dll', '.so', '.dylib',
    '.scr', '.vbs', '.js', '.jse',
    '.wsf', '.wsh', '.msi', '.jar',
    '.com', '.pif', '.gadget'
  ]
};

export class FileSecurityValidator {
  // 파일 타입 검증
  static validateFileType(
    file: File,
    allowedTypes: string[]
  ): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `허용되지 않은 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`
      };
    }
    
    // 파일 확장자 추가 검증
    const fileName = file.name.toLowerCase();
    const hasInvalidExtension = FileUploadConfig.DANGEROUS_EXTENSIONS.some(
      ext => fileName.endsWith(ext)
    );
    
    if (hasInvalidExtension) {
      return {
        valid: false,
        error: '보안상 허용되지 않는 파일 확장자입니다'
      };
    }
    
    return { valid: true };
  }
  
  // 파일 크기 검증
  static validateFileSize(
    file: File,
    maxSize: number
  ): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `파일 크기가 ${maxSizeMB}MB를 초과할 수 없습니다`
      };
    }
    
    return { valid: true };
  }
  
  // 파일명 안전성 검사
  static sanitizeFileName(fileName: string): string {
    // 특수문자 제거 (알파벳, 숫자, 하이픈, 언더스코어, 점만 허용)
    let sanitized = fileName.replace(/[^a-zA-Z0-9가-힣\-_.]/g, '_');
    
    // 연속된 점 제거 (경로 탐색 공격 방지)
    sanitized = sanitized.replace(/\.{2,}/g, '_');
    
    // 길이 제한
    if (sanitized.length > 255) {
      const extension = sanitized.substring(sanitized.lastIndexOf('.'));
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
      sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
    }
    
    return sanitized;
  }
  
  // 이미지 파일 검증
  static async validateImage(
    file: File
  ): Promise<{ valid: boolean; error?: string }> {
    // 타입 검증
    const typeValidation = this.validateFileType(
      file,
      FileUploadConfig.ALLOWED_IMAGE_TYPES
    );
    if (!typeValidation.valid) return typeValidation;
    
    // 크기 검증
    const sizeValidation = this.validateFileSize(
      file,
      FileUploadConfig.MAX_FILE_SIZE.IMAGE
    );
    if (!sizeValidation.valid) return sizeValidation;
    
    // 실제 이미지 내용 검증 (매직 넘버 체크)
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // JPEG
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return { valid: true };
      }
      
      // PNG
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return { valid: true };
      }
      
      // GIF
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return { valid: true };
      }
      
      // WebP
      if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return { valid: true };
      }
      
      return {
        valid: false,
        error: '유효하지 않은 이미지 파일입니다'
      };
    } catch (error) {
      return {
        valid: false,
        error: '파일 검증 중 오류가 발생했습니다'
      };
    }
  }
  
  // 문서 파일 검증
  static validateDocument(
    file: File
  ): { valid: boolean; error?: string } {
    // 타입 검증
    const typeValidation = this.validateFileType(
      file,
      FileUploadConfig.ALLOWED_DOCUMENT_TYPES
    );
    if (!typeValidation.valid) return typeValidation;
    
    // 크기 검증
    const sizeValidation = this.validateFileSize(
      file,
      FileUploadConfig.MAX_FILE_SIZE.DOCUMENT
    );
    if (!sizeValidation.valid) return sizeValidation;
    
    return { valid: true };
  }
  
  // 멀티파트 폼 데이터에서 파일 추출 및 검증
  static async validateFormDataFiles(
    formData: FormData,
    fieldName: string,
    options: {
      maxFiles?: number;
      allowedTypes?: string[];
      maxSize?: number;
    } = {}
  ): Promise<{
    valid: boolean;
    files?: File[];
    errors?: string[];
  }> {
    const files = formData.getAll(fieldName) as File[];
    const errors: string[] = [];
    
    // 파일 개수 검증
    if (options.maxFiles && files.length > options.maxFiles) {
      errors.push(`최대 ${options.maxFiles}개의 파일만 업로드할 수 있습니다`);
    }
    
    // 각 파일 검증
    const validatedFiles: File[] = [];
    
    for (const file of files) {
      // 타입 검증
      if (options.allowedTypes) {
        const typeValidation = this.validateFileType(file, options.allowedTypes);
        if (!typeValidation.valid) {
          errors.push(`${file.name}: ${typeValidation.error}`);
          continue;
        }
      }
      
      // 크기 검증
      if (options.maxSize) {
        const sizeValidation = this.validateFileSize(file, options.maxSize);
        if (!sizeValidation.valid) {
          errors.push(`${file.name}: ${sizeValidation.error}`);
          continue;
        }
      }
      
      validatedFiles.push(file);
    }
    
    return {
      valid: errors.length === 0,
      files: validatedFiles,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

// 파일 업로드 미들웨어
export async function validateFileUpload(
  request: NextRequest,
  options: {
    fieldName: string;
    fileType: 'image' | 'document' | 'any';
    maxFiles?: number;
    required?: boolean;
  }
): Promise<{
  valid: boolean;
  files?: File[];
  error?: string;
}> {
  try {
    const formData = await request.formData();
    const files = formData.getAll(options.fieldName) as File[];
    
    if (files.length === 0 && options.required) {
      return {
        valid: false,
        error: '파일이 업로드되지 않았습니다'
      };
    }
    
    // 파일 타입별 설정
    let allowedTypes: string[] = [];
    let maxSize = FileUploadConfig.MAX_FILE_SIZE.DEFAULT;
    
    switch (options.fileType) {
      case 'image':
        allowedTypes = FileUploadConfig.ALLOWED_IMAGE_TYPES;
        maxSize = FileUploadConfig.MAX_FILE_SIZE.IMAGE;
        break;
      case 'document':
        allowedTypes = FileUploadConfig.ALLOWED_DOCUMENT_TYPES;
        maxSize = FileUploadConfig.MAX_FILE_SIZE.DOCUMENT;
        break;
      case 'any':
        allowedTypes = [
          ...FileUploadConfig.ALLOWED_IMAGE_TYPES,
          ...FileUploadConfig.ALLOWED_DOCUMENT_TYPES
        ];
        break;
    }
    
    const validation = await FileSecurityValidator.validateFormDataFiles(
      formData,
      options.fieldName,
      {
        maxFiles: options.maxFiles,
        allowedTypes,
        maxSize
      }
    );
    
    if (!validation.valid) {
      return {
        valid: false,
        error: validation.errors?.join(', ')
      };
    }
    
    return {
      valid: true,
      files: validation.files
    };
  } catch (error) {
    console.error('File upload validation error:', error);
    return {
      valid: false,
      error: '파일 업로드 검증 중 오류가 발생했습니다'
    };
  }
}