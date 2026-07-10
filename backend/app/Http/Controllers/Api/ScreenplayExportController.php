<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Script;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Process;
use Symfony\Component\Process\Process as SymfonyProcess;

class ScreenplayExportController extends Controller
{
    public function exportPDF(Request $request, $filmId, $scriptId)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($scriptId);
        
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
            'fontSize' => 'nullable|integer|min:10|max:14',
            'fontFamily' => 'nullable|string|max:100',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', $script->title);
        $fontSize = $request->input('fontSize', 12);
        $fontFamily = $request->input('fontFamily', 'Courier Prime');

        // Build full HTML with screenplay CSS
        $fullHtml = $this->buildPrintHtml($html, $title, $fontSize, $fontFamily);

        // Try Puppeteer/Chrome headless first
        $pdfPath = $this->generatePdfWithChrome($fullHtml);
        
        if ($pdfPath && file_exists($pdfPath)) {
            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $title . '.pdf"',
            ])->deleteFileAfterSend(true);
        }

        // Fallback: return HTML for browser print
        return response($fullHtml, 200, [
            'Content-Type' => 'text/html',
            'Content-Disposition' => 'inline; filename="' . $title . '.html"',
        ]);
    }

    public function exportDOCX(Request $request, $filmId, $scriptId)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($scriptId);
        
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', $script->title);

        // Convert HTML to DOCX using LibreOffice or mammoth-like conversion
        // For now, return HTML with .docx extension (browser will handle)
        $fullHtml = $this->buildDocxHtml($html, $title);

        return response($fullHtml, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $title . '.docx"',
        ]);
    }

    public function exportFountain(Request $request, $filmId, $scriptId)
    {
        $script = Script::where('film_id', $filmId)->findOrFail($scriptId);
        
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', $script->title);

        $fountain = $this->convertToFountain($html, $title);

        return response($fountain, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $title . '.fountain"',
        ]);
    }

    private function buildPrintHtml($content, $title, $fontSize, $fontFamily)
    {
        $css = $this->getScreenplayCss($fontSize, $fontFamily);
        
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>$title</title>
    <style>$css</style>
    <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="screenplay-editor" style="font-size: {$fontSize}pt; font-family: '$fontFamily', 'Courier Prime', monospace;">
        $content
    </div>
</body>
</html>
HTML;
    }

    private function buildDocxHtml($content, $title)
    {
        $css = $this->getScreenplayCss(12, 'Courier Prime');
        
        return <<<HTML
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' lang="en">
<head>
    <meta charset="UTF-8">
    <title>$title</title>
    <style>$css</style>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
</head>
<body>
    <div class="screenplay-editor" style="font-size: 12pt; font-family: 'Courier Prime', 'Courier New', monospace;">
        $content
    </div>
</body>
</html>
HTML;
    }

    private function getScreenplayCss($fontSize = 12, $fontFamily = 'Courier Prime')
    {
        return <<<CSS
@page {
    size: letter;
    margin: 1in 1.5in 1in 1.5in;
    @bottom-center {
        content: "Page " counter(page);
        font-family: '$fontFamily', monospace;
        font-size: 10pt;
        color: #666;
    }
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: '$fontFamily', 'Courier Prime', 'Courier New', Courier, monospace;
    font-size: ${fontSize}pt;
    line-height: 1.0;
    color: #000;
    background: #fff;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0;
}

.screenplay-editor {
    font-family: '$fontFamily', 'Courier Prime', 'Courier New', Courier, monospace;
    font-size: ${fontSize}pt;
    line-height: 1.0;
    color: #000;
    background: #fff;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 1in 1.5in;
    min-height: 11in;
}

.screenplay-element {
    margin: 0;
    padding: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: inherit;
    font-size: inherit;
    line-height: 1.0;
}

.screenplay-scene-heading {
    margin: 24pt 0 12pt 0;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: 0;
    page-break-after: avoid;
}

.screenplay-action {
    margin: 12pt 0;
    text-indent: 0;
    text-align: justify;
    widows: 2;
    orphans: 2;
}

.screenplay-character {
    margin: 12pt 0 0 222pt;
    max-width: 222pt;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: 0;
    page-break-after: avoid;
}

.screenplay-parenthetical {
    margin: 6pt 0 6pt 186pt;
    max-width: 150pt;
    font-style: italic;
    text-indent: 0;
    page-break-after: avoid;
}

.screenplay-dialogue {
    margin: 0 0 12pt 150pt;
    max-width: 252pt;
    text-indent: 0;
    text-align: left;
    widows: 2;
    orphans: 2;
}

.screenplay-transition {
    margin: 24pt 0 12pt auto;
    text-align: right;
    text-transform: uppercase;
    font-weight: bold;
    text-indent: 0;
    max-width: 360pt;
    page-break-before: avoid;
}

.screenplay-shot {
    margin: 12pt 0;
    text-indent: 0;
    font-style: italic;
    text-transform: uppercase;
}

@media print {
    .screenplay-editor {
        margin: 0;
        padding: 1in 1.5in;
        max-width: none;
        box-shadow: none;
    }
    .screenplay-element {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
CSS;
    }

    private function convertToFountain($html, $title)
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);
        $elements = $xpath->query('//*[@data-element-type]');

        $lines = [];
        $lines[] = "Title: $title";
        $lines[] = "Author: ";
        $lines[] = "Source: ";
        $lines[] = "Draft: ";
        $lines[] = "Date: " . date('Y-m-d');
        $lines[] = "Contact: ";
        $lines[] = "";

        foreach ($elements as $el) {
            $type = $el->getAttribute('data-element-type');
            $text = trim($el->textContent);
            if (!$text) continue;

            switch ($type) {
                case 'scene-heading':
                    $lines[] = strtoupper($text);
                    break;
                case 'action':
                    $lines[] = $text;
                    break;
                case 'character':
                    $lines[] = strtoupper($text);
                    break;
                case 'parenthetical':
                    $lines[] = '(' . trim($text, '()') . ')';
                    break;
                case 'dialogue':
                    $lines[] = $text;
                    break;
                case 'transition':
                    $lines[] = '> ' . strtoupper($text);
                    break;
                case 'shot':
                    $lines[] = strtoupper($text);
                    break;
                default:
                    $lines[] = $text;
            }

            // Add blank line between elements (except after transition)
            if ($type !== 'transition') {
                $lines[] = "";
            }
        }

        return implode("\n", $lines);
    }

    private function generatePdfWithChrome($html)
    {
        // Try to find Chrome/Chromium
        $chromePaths = [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            'C:\Program Files\Google\Chrome\Application\chrome.exe',
            'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        ];

        $chrome = null;
        foreach ($chromePaths as $path) {
            if (file_exists($path)) {
                $chrome = $path;
                break;
            }
        }

        if (!$chrome) {
            // Try which command
            $result = shell_exec('which google-chrome 2>/dev/null || which chromium 2>/dev/null || which chromium-browser 2>/dev/null');
            if ($result) {
                $chrome = trim($result);
            }
        }

        if (!$chrome) {
            return false;
        }

        $tempDir = storage_path('app/temp');
        if (!file_exists($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $htmlFile = $tempDir . '/export_' . uniqid() . '.html';
        $pdfFile = $tempDir . '/export_' . uniqid() . '.pdf';

        file_put_contents($htmlFile, $html);

        $cmd = "$chrome --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --print-to-pdf=$pdfFile --print-to-pdf-no-header $htmlFile";

        $process = new SymfonyProcess($cmd);
        $process->setTimeout(60);
        $process->run();

        if ($process->isSuccessful() && file_exists($pdfFile) && filesize($pdfFile) > 0) {
            // Clean up HTML file
            @unlink($htmlFile);
            return $pdfFile;
        }

        @unlink($htmlFile);
        @unlink($pdfFile);
        return false;
    }
}