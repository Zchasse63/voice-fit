"""
CSV Import Service

Handles CSV program uploads with:
- AI-assisted schema detection and mapping
- Data cleaning and validation
- Program quality review
- Bulk import to database
"""

import os
import json
import csv
from io import StringIO
from typing import Any, Dict, List, Optional
from supabase import Client
from openai import OpenAI


class CSVImportService:
    """AI-powered CSV import with schema guidance"""

    def __init__(self, supabase: Client):
        self.supabase = supabase
        self.client = OpenAI(
            api_key=os.getenv("XAI_API_KEY"),
            base_url="https://api.x.ai/v1",
        )
        self.model = "grok-4-fast-reasoning"

    def analyze_csv_schema(
        self, csv_content: str, file_name: str
    ) -> Dict[str, Any]:
        """
        Analyze CSV and detect schema with AI assistance

        Args:
            csv_content: Raw CSV content
            file_name: Original file name

        Returns:
            {
                "detected_columns": [{"csv_column": str, "mapped_to": str, "confidence": float}],
                "sample_rows": [...],
                "total_rows": int,
                "issues": [{"type": str, "message": str, "severity": str}]
            }
        """
        try:
            # Parse CSV
            csv_reader = csv.DictReader(StringIO(csv_content))
            rows = list(csv_reader)
            headers = csv_reader.fieldnames or []

            # Get sample rows (first 5)
            sample_rows = rows[:5]

            # Build AI prompt for schema detection
            prompt = f"""Analyze this CSV file and map columns to our workout program schema.

File name: {file_name}
Headers: {headers}
Sample rows:
{json.dumps(sample_rows, indent=2)}

Our expected schema:
- program_name: Name of the program
- week_number: Week number (1-12)
- day_of_week: Day of week (1-7 or Mon-Sun)
- workout_name: Name of the workout
- exercise_name: Exercise name
- sets: Number of sets
- reps: Number of reps (or rep range like "8-12")
- weight: Weight in lbs (optional)
- rest_seconds: Rest period in seconds (optional)
- notes: Additional notes (optional)

Return JSON:
{{
  "detected_columns": [
    {{
      "csv_column": "original_column_name",
      "mapped_to": "our_schema_field",
      "confidence": 0.0-1.0,
      "reasoning": "why this mapping"
    }}
  ],
  "issues": [
    {{
      "type": "missing_column|invalid_format|duplicate_column",
      "message": "description",
      "severity": "error|warning|info"
    }}
  ]
}}

Be smart about variations:
- "Week" or "Wk" → week_number
- "Day" or "Weekday" → day_of_week
- "Exercise" or "Movement" → exercise_name
- "Reps" or "Repetitions" → reps
- "Sets" or "Set" → sets"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing CSV files and mapping them to database schemas. Be intelligent about column name variations and provide high-confidence mappings.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )

            analysis = json.loads(response.choices[0].message.content)

            return {
                "detected_columns": analysis.get("detected_columns", []),
                "sample_rows": sample_rows,
                "total_rows": len(rows),
                "issues": analysis.get("issues", []),
            }

        except Exception as e:
            print(f"Error analyzing CSV schema: {e}")
            return {
                "detected_columns": [],
                "sample_rows": [],
                "total_rows": 0,
                "issues": [
                    {
                        "type": "error",
                        "message": f"Failed to analyze CSV: {str(e)}",
                        "severity": "error",
                    }
                ],
            }

    def review_program_quality(
        self, csv_content: str, schema_mapping: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        AI-powered program quality review

        Args:
            csv_content: Raw CSV content
            schema_mapping: Confirmed column mappings

        Returns:
            {
                "overall_score": 0-100,
                "issues": [{"type": str, "message": str, "severity": str, "line_numbers": []}],
                "suggestions": [{"message": str, "impact": str}]
            }
        """
        try:
            # Parse CSV with confirmed schema
            csv_reader = csv.DictReader(StringIO(csv_content))
            rows = list(csv_reader)

            # Build program summary for AI
            program_summary = self._build_program_summary(rows, schema_mapping)

            # AI quality review prompt
            prompt = f"""Review this workout program for quality and best practices.

Program summary:
{json.dumps(program_summary, indent=2)}

Evaluate:
1. **Volume**: Is weekly volume appropriate? (10-20 sets per muscle group)
2. **Progression**: Does the program progress logically over weeks?
3. **Balance**: Are muscle groups balanced? (push/pull ratio, etc.)
4. **Exercise selection**: Are exercises appropriate and varied?
5. **Rest periods**: Are rest periods reasonable?
6. **Deload weeks**: Are there deload weeks every 4-6 weeks?

Return JSON:
{{
  "overall_score": 0-100,
  "issues": [
    {{
      "type": "volume|progression|balance|exercise_selection|rest|deload",
      "message": "specific issue description",
      "severity": "error|warning|info",
      "line_numbers": [1, 2, 3]
    }}
  ],
  "suggestions": [
    {{
      "message": "specific improvement suggestion",
      "impact": "high|medium|low"
    }}
  ]
}}"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert strength coach reviewing workout programs. Provide actionable feedback based on evidence-based training principles.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                response_format={"type": "json_object"},
            )

            review = json.loads(response.choices[0].message.content)
            return review

        except Exception as e:
            print(f"Error reviewing program quality: {e}")
            return {
                "overall_score": 50,
                "issues": [],
                "suggestions": [],
            }

    def _build_program_summary(
        self, rows: List[Dict], schema_mapping: Dict[str, str]
    ) -> Dict[str, Any]:
        """Build program summary for AI review"""
        # Group by week
        weeks = {}
        for row in rows:
            week = row.get(schema_mapping.get("week_number", "week"), "1")
            if week not in weeks:
                weeks[week] = {"exercises": [], "total_sets": 0}

            exercise = row.get(schema_mapping.get("exercise_name", "exercise"), "Unknown")
            sets = int(row.get(schema_mapping.get("sets", "sets"), 0) or 0)

            weeks[week]["exercises"].append(exercise)
            weeks[week]["total_sets"] += sets

        return {
            "total_weeks": len(weeks),
            "total_rows": len(rows),
            "weeks": weeks,
        }

