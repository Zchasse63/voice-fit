"use client";

/**
 * SchemaMappingUI Component
 * 
 * Displays AI-detected column mappings with confidence scores.
 * Allows manual override/correction and validation before import.
 */

import { useState } from "react";
import { AlertCircle, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetectedColumn {
  csv_column: string;
  mapped_to: string;
  confidence: number;
  reasoning: string;
}

interface Issue {
  type: string;
  message: string;
  severity: "error" | "warning" | "info";
}

interface SchemaMappingUIProps {
  detectedColumns: DetectedColumn[];
  issues: Issue[];
  sampleRows: any[];
  headers: string[];
  onMappingConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SCHEMA_FIELDS = [
  "program_name",
  "week_number",
  "day_of_week",
  "workout_name",
  "exercise_name",
  "sets",
  "reps",
  "weight",
  "rest_seconds",
  "notes",
];

export function SchemaMappingUI({
  detectedColumns,
  issues,
  sampleRows,
  headers,
  onMappingConfirm,
  onCancel,
  isLoading = false,
}: SchemaMappingUIProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(detectedColumns.map((col) => [col.csv_column, col.mapped_to]))
  );
  const [expandedIssues, setExpandedIssues] = useState(false);

  const handleMappingChange = (csvColumn: string, newMapping: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvColumn]: newMapping,
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success-light dark:text-success-dark";
    if (confidence >= 0.6) return "text-warning-light dark:text-warning-dark";
    return "text-error-light dark:text-error-dark";
  };

  const getIssueIcon = (severity: string) => {
    if (severity === "error") return <AlertCircle className="w-5 h-5 text-error-light dark:text-error-dark" />;
    if (severity === "warning") return <AlertTriangle className="w-5 h-5 text-warning-light dark:text-warning-dark" />;
    return <AlertCircle className="w-5 h-5 text-info-light dark:text-info-dark" />;
  };

  const handleConfirm = () => {
    onMappingConfirm(mapping);
  };

  return (
    <div className="space-y-lg">
      {/* Issues Summary */}
      {issues.length > 0 && (
        <div className="card border border-warning-light/30 dark:border-warning-dark/30 bg-warning-light/5 dark:bg-warning-dark/5">
          <button
            onClick={() => setExpandedIssues(!expandedIssues)}
            className="w-full flex items-center justify-between p-md"
          >
            <div className="flex items-center gap-sm">
              <AlertTriangle className="w-5 h-5 text-warning-light dark:text-warning-dark" />
              <span className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {issues.length} issue{issues.length !== 1 ? "s" : ""} found
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 transition-transform",
                expandedIssues && "rotate-180"
              )}
            />
          </button>
          {expandedIssues && (
            <div className="space-y-sm p-md border-t border-warning-light/30 dark:border-warning-dark/30">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-sm">
                  {getIssueIcon(issue.severity)}
                  <div>
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {issue.type}
                    </p>
                    <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                      {issue.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Column Mappings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-lg">
          Column Mappings
        </h3>
        <div className="space-y-md">
          {detectedColumns.map((col) => (
            <div key={col.csv_column} className="p-md border border-border-light-light dark:border-border-dark-light rounded-md">
              <div className="flex items-start justify-between mb-sm">
                <div>
                  <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {col.csv_column}
                  </p>
                  <p className={cn("text-sm", getConfidenceColor(col.confidence))}>
                    Confidence: {(col.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-success-light dark:text-success-dark" />
              </div>
              <select
                value={mapping[col.csv_column] || ""}
                onChange={(e) => handleMappingChange(col.csv_column, e.target.value)}
                className="w-full p-sm border border-border-light-light dark:border-border-dark-light rounded-md bg-background-light-primary dark:bg-background-dark-primary text-text-light-primary dark:text-text-dark-primary"
              >
                <option value="">Select mapping...</option>
                {SCHEMA_FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-sm">
                {col.reasoning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-md">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="btn-primary flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm Mapping"}
        </button>
      </div>
    </div>
  );
}

