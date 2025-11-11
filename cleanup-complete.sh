#!/bin/bash

# Complete VoiceFit Repository Cleanup
# Handles both tracked and untracked files

set -e

echo "🧹 Complete Repository Cleanup"
echo "=============================="
echo ""

# Create archive structure
echo "📁 Creating archive structure..."
mkdir -p archive/documentation
mkdir -p archive/testing/scripts
mkdir -p archive/testing/results
mkdir -p archive/testing/logs
mkdir -p archive/scripts
mkdir -p archive/fine-tuning
mkdir -p archive/research
mkdir -p archive/database-migrations

# Move all .md files except README.md and .env.example
echo "📄 Moving documentation files..."
for file in *.md; do
    if [ "$file" != "README.md" ] && [ -f "$file" ]; then
        mv "$file" archive/documentation/ 2>/dev/null || true
    fi
done

# Move all Python test scripts
echo "🐍 Moving test scripts..."
for file in test_*.py; do
    [ -f "$file" ] && mv "$file" archive/testing/scripts/ 2>/dev/null || true
done

# Move all other Python scripts
echo "🔧 Moving utility scripts..."
for file in *.py; do
    if [[ ! "$file" =~ ^test_ ]] && [ -f "$file" ]; then
        mv "$file" archive/scripts/ 2>/dev/null || true
    fi
done

# Move all JSON files except package.json
echo "📊 Moving JSON files..."
for file in *.json; do
    if [ "$file" != "package.json" ] && [ -f "$file" ]; then
        mv "$file" archive/testing/results/ 2>/dev/null || true
    fi
done

# Move all .txt and .log files
echo "📝 Moving log files..."
for file in *.txt *.log; do
    [ -f "$file" ] && mv "$file" archive/testing/logs/ 2>/dev/null || true
done

# Move all .sh files except this one
echo "🔨 Moving shell scripts..."
for file in *.sh; do
    if [ "$file" != "cleanup-complete.sh" ] && [ -f "$file" ]; then
        mv "$file" archive/scripts/ 2>/dev/null || true
    fi
done

# Move all .sql files
echo "🗄️  Moving SQL files..."
for file in *.sql; do
    [ -f "$file" ] && mv "$file" archive/database-migrations/ 2>/dev/null || true
done

# Move directories
echo "📦 Moving data directories..."
[ -d "pilot_data" ] && mv pilot_data archive/testing/ 2>/dev/null || true
[ -d "research_results" ] && mv research_results archive/research/ 2>/dev/null || true
[ -d "training_data" ] && mv training_data archive/fine-tuning/ 2>/dev/null || true

# Move weird filename
echo "🧹 Cleaning up special files..."
mv "# GPT"*".md" archive/documentation/ 2>/dev/null || true
mv ".env 2" archive/scripts/ 2>/dev/null || true
mv "UI UX Spec" archive/documentation/ 2>/dev/null || true

# Move program_run* logs
for file in program_run*.log; do
    [ -f "$file" ] && mv "$file" archive/testing/logs/ 2>/dev/null || true
done

# Move upload_results.log
[ -f "upload_results.log" ] && mv upload_results.log archive/testing/logs/ 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Root directory now contains:"
ls -1 | grep -v "^archive$" | grep -v "^apps$" | grep -v "^docs$" | grep -v "^packages$" | grep -v "^supabase$" | grep -v "^tests$" | head -20
echo ""

