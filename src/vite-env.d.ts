/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare modules for dependencies that may not have types installed yet
declare module 'react-dropzone' {
  import { FC, CSSProperties } from 'react';

  export interface Accept {
    [key: string]: string[];
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    acceptedFiles: File[];
  }

  export interface DropzoneRootProps {
    refKey?: string;
    role?: string;
    [key: string]: any;
  }

  export interface DropzoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    refKey?: string;
  }

  export interface DropzoneOptions {
    accept?: Accept;
    disabled?: boolean;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    maxFiles?: number;
    onDrop?: (acceptedFiles: File[], rejectedFiles: any[]) => void;
    onDropAccepted?: (files: File[]) => void;
    onDropRejected?: (files: any[]) => void;
    onDragEnter?: () => void;
    onDragOver?: () => void;
    onDragLeave?: () => void;
    noClick?: boolean;
    noDrag?: boolean;
    noKeyboard?: boolean;
    preventDropOnDocument?: boolean;
    useFsAccessApi?: boolean;
  }

  export interface DropzoneRef {
    open: () => void;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState & {
    getRootProps: (props?: DropzoneRootProps) => DropzoneRootProps;
    getInputProps: (props?: DropzoneInputProps) => DropzoneInputProps;
    rootRef: React.RefObject<HTMLElement>;
    inputRef: React.RefObject<HTMLInputElement>;
    open: () => void;
  };

  export default useDropzone;
}

declare module 'file-saver' {
  export function saveAs(data: Blob | File | string, filename?: string, options?: any): void;
}

declare module 'papaparse' {
  export interface ParseConfig {
    delimiter?: string;
    header?: boolean;
    skipEmptyLines?: boolean;
    complete?: (results: ParseResult) => void;
    error?: (error: any) => void;
  }

  export interface ParseResult {
    data: any[];
    errors: any[];
    meta: {
      delimiter: string;
      linebreak: string;
      aborted: boolean;
      truncated: boolean;
      fields?: string[];
    };
  }

  export function parse(input: string | File, config?: ParseConfig): ParseResult;
  export function unparse(data: any[], config?: any): string;
}

// PWA virtual module types
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }

  export interface WorkSheet {
    [cell: string]: CellObject;
  }

  export interface CellObject {
    t: string;
    v: any;
    w?: string;
    f?: string;
  }

  export function read(data: ArrayBuffer | Uint8Array | string, opts?: any): WorkBook;
  export function write(wb: WorkBook, opts?: any): ArrayBuffer | string;
  export const utils: {
    sheet_to_json: (ws: WorkSheet, opts?: any) => any[];
    json_to_sheet: (data: any[], opts?: any) => WorkSheet;
    book_new: () => WorkBook;
    book_append_sheet: (wb: WorkBook, ws: WorkSheet, name: string) => void;
    decode_range: (range: string) => any;
    encode_cell: (cell: { r: number; c: number }) => string;
  };
}
