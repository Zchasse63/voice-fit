"use client";

/**
 * CSV Import Page
 * 
 * Allows coaches to bulk upload programs via CSV.
 */

import { CSVImport } from "@/components/coach/CSVImport";

export default function ImportPage() {
  return (
    <div className="space-y-lg max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-sm">
          CSV Import
        </h1>
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Upload a CSV file to bulk create training programs for your clients
        </p>
      </div>

      <CSVImport />

      {/* Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-md">
          CSV Format Instructions
        </h3>
        <div className="space-y-sm text-sm text-text-light-secondary dark:text-text-dark-secondary">
          <p>Your CSV file should include the following columns:</p>
          <ul className="list-disc list-inside space-y-xs pl-md">
            <li>client_email - Email address of the client</li>
            <li>program_name - Name of the training program</li>
            <li>duration_weeks - Program duration in weeks</li>
            <li>goal - Training goal (strength, hypertrophy, endurance, etc.)</li>
            <li>experience_level - Beginner, intermediate, or advanced</li>
          </ul>
          <p className="mt-md">
            The AI will automatically generate a complete program based on these parameters.
          </p>
        </div>
      </div>
    </div>
  );
}

