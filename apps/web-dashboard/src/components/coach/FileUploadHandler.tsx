"use client";

/**
 * FileUploadHandler
 * 
 * Handles CSV, Excel (.xlsx), and Google Sheets imports.
 * Converts all formats to CSV for processing.
 */

import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedFileData {
  headers: string[];
  rows: any[];
  preview: any[];
  fileName: string;
  sheetName?: string;
}

export class FileUploadHandler {
  /**
   * Parse CSV file
   */
  static parseCSV(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          const rows = results.data;
          const preview = rows.slice(0, 5);

          resolve({
            headers,
            rows,
            preview,
            fileName: file.name,
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse Excel file (.xlsx)
   */
  static parseExcel(file: File): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });

          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const rows = XLSX.utils.sheet_to_json(worksheet);
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          const preview = rows.slice(0, 5);

          resolve({
            headers,
            rows,
            preview,
            fileName: file.name,
            sheetName,
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse Google Sheets URL and fetch data
   */
  static async parseGoogleSheets(sheetUrl: string): Promise<ParsedFileData> {
    try {
      // Extract sheet ID from URL
      const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error("Invalid Google Sheets URL");
      }

      const sheetId = sheetIdMatch[1];

      // Export as CSV from Google Sheets
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch Google Sheets data");
      }

      const csvContent = await response.text();

      // Parse CSV
      return new Promise((resolve, reject) => {
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data;
            const preview = rows.slice(0, 5);

            resolve({
              headers,
              rows,
              preview,
              fileName: `GoogleSheet_${sheetId}`,
            });
          },
          error: (error) => {
            reject(new Error(`Failed to parse Google Sheets: ${error.message}`));
          },
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Detect file type and parse accordingly
   */
  static async parseFile(file: File): Promise<ParsedFileData> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".csv")) {
      return this.parseCSV(file);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      return this.parseExcel(file);
    } else {
      throw new Error("Unsupported file format. Please use CSV or Excel (.xlsx)");
    }
  }
}

