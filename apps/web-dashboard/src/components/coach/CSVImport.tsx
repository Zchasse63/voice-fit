"use client";

/**
 * CSVImport Component
 *
 * Multi-step workflow: File upload → Schema mapping → Program preview → Client assignment
 */

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SchemaMappingUI } from "./SchemaMappingUI";
import { ProgramPreview } from "./ProgramPreview";
import { BulkClientAssignment } from "./BulkClientAssignment";
import { FileUploadHandler } from "./FileUploadHandler";

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

type ImportStep = "upload" | "mapping" | "preview" | "assignment" | "complete";

export function CSVImport({ clientId, onImportComplete, className }: CSVImportProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schema mapping state
  const [detectedColumns, setDetectedColumns] = useState<any[]>([]);
  const [schemaIssues, setSchemaIssues] = useState<any[]>([]);
  const [confirmedMapping, setConfirmedMapping] = useState<Record<string, string>>({});

  // Program preview state
  const [programData, setProgramData] = useState<any>(null);
  const [qualityReview, setQualityReview] = useState<any>(null);

  // Client assignment state
  const [availableClients, setAvailableClients] = useState<any[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const fileData = await FileUploadHandler.parseFile(selectedFile);

      setFile(selectedFile);
      setParsedData({
        headers: fileData.headers,
        rows: fileData.rows,
        preview: fileData.preview,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !parsedData) return;

    try {
      setIsLoading(true);
      setError(null);

      // Read file content
      const fileContent = await file.text();

      // Call schema analysis API
      const response = await fetch("/api/csv/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_content: fileContent,
          file_name: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to analyze CSV");
      }

      setDetectedColumns(data.detected_columns || []);
      setSchemaIssues(data.issues || []);
      setStep("mapping");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    try {
      setIsLoading(true);
      setError(null);

      const fileContent = await file!.text();

      // Call quality review API
      const response = await fetch("/api/csv/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_content: fileContent,
          field_mapping: mapping,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to review program");
      }

      setConfirmedMapping(mapping);
      setQualityReview(data);
      setStep("preview");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewProceed = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch available clients
      const response = await fetch("/api/coach/clients");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to fetch clients");
      }

      setAvailableClients(data.clients || []);
      setStep("assignment");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentComplete = async (assignments: any[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const fileContent = await file!.text();

      // Call import API
      const response = await fetch("/api/csv/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_content: fileContent,
          field_mapping: confirmedMapping,
          assignments: assignments,
          program_metadata: {
            file_name: file!.name,
            total_rows: parsedData!.rows.length,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to import program");
      }

      setSuccess(true);
      setStep("complete");
      setFile(null);
      setParsedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onImportComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStep("upload");
    setFile(null);
    setParsedData(null);
    setError(null);
    setSuccess(false);
    setDetectedColumns([]);
    setSchemaIssues([]);
    setConfirmedMapping({});
    setProgramData(null);
    setQualityReview(null);
    setAvailableClients([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            CSV Import
          </h3>
          <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary mt-xs">
            Step {step === "upload" ? 1 : step === "mapping" ? 2 : step === "preview" ? 3 : 4} of 4
          </p>
        </div>
        {step !== "upload" && (
          <button
            onClick={handleCancel}
            className="p-2 rounded-md hover:bg-background-light-tertiary dark:hover:bg-background-dark-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Step 1: File Upload */}
      {step === "upload" && (
        <div className="space-y-md">
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed border-border-light-light dark:border-border-dark-light rounded-md p-xl text-center transition-colors",
              isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary"
            )}
          >
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 mx-auto mb-md border-4 border-primary-500/20 dark:border-primary-dark/20 border-t-primary-500 dark:border-t-primary-dark rounded-full animate-spin" />
                <p className="text-text-light-primary dark:text-text-dark-primary font-medium">
                  Parsing file...
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-md text-text-light-tertiary dark:text-text-dark-tertiary" />
                <p className="text-text-light-primary dark:text-text-dark-primary font-medium mb-xs">
                  Click to upload file
                </p>
                <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                  Upload CSV, Excel (.xlsx), or Google Sheets to bulk create programs
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

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

              <button
                onClick={handleUpload}
                disabled={isLoading}
                className={cn(
                  "btn-primary w-full",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? "Analyzing..." : "Analyze & Continue"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schema Mapping */}
      {step === "mapping" && (
        <SchemaMappingUI
          detectedColumns={detectedColumns}
          issues={schemaIssues}
          sampleRows={parsedData?.preview || []}
          headers={parsedData?.headers || []}
          onMappingConfirm={handleMappingConfirm}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Step 3: Program Preview */}
      {step === "preview" && qualityReview && (
        <ProgramPreview
          programName={file?.name?.replace(".csv", "") || "Program"}
          weeks={[]}
          qualityScore={qualityReview.overall_score || 0}
          qualityIssues={qualityReview.issues || []}
          csvRows={parsedData?.rows || []}
          fieldMapping={confirmedMapping}
          onProceed={handlePreviewProceed}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Step 4: Client Assignment */}
      {step === "assignment" && (
        <BulkClientAssignment
          clients={availableClients}
          onAssign={handleAssignmentComplete}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {/* Success Message */}
      {step === "complete" && success && (
        <div className="flex items-start gap-sm p-md bg-success-light/10 dark:bg-success-dark/10 border border-success-light dark:border-success-dark rounded-md">
          <CheckCircle className="w-5 h-5 text-success-light dark:text-success-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success-light dark:text-success-dark">
            Program imported and assigned successfully!
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-sm p-md bg-error-light/10 dark:bg-error-dark/10 border border-error-light dark:border-error-dark rounded-md">
          <AlertCircle className="w-5 h-5 text-error-light dark:text-error-dark flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-light dark:text-error-dark">{error}</p>
        </div>
      )}
    </div>
  );
}


