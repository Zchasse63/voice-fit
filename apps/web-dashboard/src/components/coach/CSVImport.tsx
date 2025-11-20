"use client";

/**
 * CSVImport Component
 * 
 * File upload, schema mapping, and preview for bulk program creation.
 */

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Papa from "papaparse";

interface CSVImportProps {
  clientId?: string;
  onImportComplete?: () => void;
  className?: string;
}

interface ParsedData {
  headers: string[];
  rows: any[];
  preview: any[];
}

export function CSVImport({ clientId, onImportComplete, className }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    parseCSV(selectedFile);
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data;
        const preview = rows.slice(0, 5); // Show first 5 rows

        setParsedData({
          headers,
          rows,
          preview,
        });
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const handleUpload = async () => {
    if (!file || !parsedData) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (clientId) {
        formData.append("client_id", clientId);
      }

      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload CSV");
      }

      setSuccess(true);
      setFile(null);
      setParsedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onImportComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-lg">
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          CSV Import
        </h3>
        {file && (
          <button
            onClick={handleClear}
            className="p-2 rounded-md hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* File Upload */}
      {!file && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border-light-light dark:border-border-dark-light rounded-md p-xl text-center cursor-pointer hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto mb-md text-text-light-tertiary dark:text-text-dark-tertiary" />
          <p className="text-text-light-primary dark:text-text-dark-primary font-medium mb-xs">
            Click to upload CSV file
          </p>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            Upload a CSV file to bulk create programs
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* File Info */}
      {file && parsedData && (
        <div className="space-y-md">
          <div className="flex items-center gap-sm p-md bg-background-light-secondary dark:bg-background-dark-secondary rounded-md">
            <FileText className="w-5 h-5 text-primary-500 dark:text-primary-dark" />
            <div className="flex-1">
              <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {file.name}
              </p>
              <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                {parsedData.rows.length} rows, {parsedData.headers.length} columns
              </p>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary mb-sm">
              Preview (first 5 rows)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-light-light dark:border-border-dark-light">
                    {parsedData.headers.map((header, i) => (
                      <th
                        key={i}
                        className="text-left p-sm font-medium text-text-light-secondary dark:text-text-dark-secondary"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.preview.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border-light-subtle dark:border-border-dark-subtle"
                    >
                      {parsedData.headers.map((header, j) => (
                        <td
                          key={j}
                          className="p-sm text-text-light-primary dark:text-text-dark-primary"
                        >
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={cn(
              "btn-primary w-full",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? "Uploading..." : "Upload & Process"}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-sm p-md bg-error-light/10 dark:bg-error-dark/10 border border-error-light dark:border-error-dark rounded-md">
          <AlertCircle className="w-5 h-5 text-error-light dark:text-error-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-light dark:text-error-dark">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-sm p-md bg-success-light/10 dark:bg-success-dark/10 border border-success-light dark:border-success-dark rounded-md">
          <CheckCircle className="w-5 h-5 text-success-light dark:text-success-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success-light dark:text-success-dark">
            CSV uploaded and processed successfully!
          </p>
        </div>
      )}
    </div>
  );
}


