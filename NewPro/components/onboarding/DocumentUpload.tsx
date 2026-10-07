"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  label: string;
  hint?: string;
  required?: boolean;
  onFileSelect?: (file: File | null) => void;
  error?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  hint = "PDF, PNG, JPG up to 10MB",
  required = true,
  onFileSelect,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onFileSelect) onFileSelect(null);
  };

  return (
    <div className="w-full flex flex-col space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-[#FFFFFF]">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
        <span className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
          {hint}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none flex items-center justify-between",
          selectedFile
            ? "border-[#D9FF3F] bg-[#D9FF3F]/10 dark:bg-[#D9FF3F]/5"
            : isDragOver
            ? "border-[#D9FF3F] bg-[#D9FF3F]/15"
            : error
            ? "border-[#EF4444] bg-[#FEF2F2] dark:bg-[#2A1515]"
            : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] hover:border-[#D9FF3F] hover:bg-[#F7F8F6] dark:hover:bg-[#202422]"
        )}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3 w-full">
            <div className="p-2 rounded-lg bg-[#D9FF3F] text-[#101212]">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-inter font-semibold text-xs sm:text-sm text-[#101212] dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
                {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove uploaded file"
              className="p-1 rounded-lg text-[#565B59] hover:text-[#DC2626] dark:text-[#B6B8B7] dark:hover:text-[#EF4444] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F7F8F6] dark:bg-[#262928] text-[#565B59] dark:text-[#B6B8B7]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <p className="font-inter font-medium text-xs sm:text-sm text-[#101212] dark:text-white">
                Click or drag &amp; drop document to upload
              </p>
              <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
                Official registration documents, credentials, or government ID
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[#DC2626] dark:text-[#F87171] font-inter mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
