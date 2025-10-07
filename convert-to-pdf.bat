@echo off
echo Converting BlockLearn documentation to PDF...
echo.

REM Method 1: Using online converter
echo Option 1: Use online converter
echo 1. Open: https://www.markdowntopdf.com/
echo 2. Copy the content from BLOCKLEARN_COMPLETE_PROJECT_PDF.md
echo 3. Paste and convert to PDF
echo.

REM Method 2: Using VS Code (if installed)
echo Option 2: Using VS Code Extension
echo 1. Install "Markdown PDF" extension in VS Code
echo 2. Open BLOCKLEARN_COMPLETE_PROJECT_PDF.md
echo 3. Press Ctrl+Shift+P and type "Markdown PDF: Export (pdf)"
echo.

REM Method 3: Manual copy to Word/Google Docs
echo Option 3: Copy to Word/Google Docs
echo 1. Copy all content from BLOCKLEARN_COMPLETE_PROJECT_PDF.md
echo 2. Paste into Microsoft Word or Google Docs
echo 3. Format and export as PDF
echo.

echo.
echo Press any key to open the markdown file for copying...
pause
notepad "BLOCKLEARN_COMPLETE_PROJECT_PDF.md"

echo.
echo Once you have the content copied, visit: https://www.markdowntopdf.com/
echo Paste the content and click "Convert to PDF"
echo.
pause
