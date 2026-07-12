<?php

namespace App\Http\Controllers\Api\Screenplay;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\PDF as DomPDF;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ScreenplayExportController extends Controller
{
    public function exportPDF(Request $request)
    {
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
            'fontSize' => 'nullable|integer|min:10|max:14',
            'fontFamily' => 'nullable|string|max:100',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', 'Screenplay');
        $fontSize = $request->input('fontSize', 12);
        $fontFamily = $request->input('fontFamily', 'Courier Prime');

        // Generate professional screenplay CSS
        $css = $this->getScreenplayCSS($fontSize, $fontFamily);

        $fullHTML = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$title}</title>
    <style>
        {$css}
    </style>
</head>
<body>
    {$html}
</body>
</html>
HTML;

        // Use headless Chrome via puppeteer or fallback to wkhtmltopdf
        $pdfPath = $this->generatePDF($fullHTML, $title);

        if ($pdfPath && File::exists($pdfPath)) {
            return response()->download($pdfPath, "{$title}.pdf", [
                'Content-Type' => 'application/pdf',
            ])->deleteFileAfterSend(true);
        }

        // Fallback: return HTML for browser print
        return response($fullHTML, 200, [
            'Content-Type' => 'text/html',
            'Content-Disposition' => 'inline; filename="' . $title . '.html"',
        ]);
    }

    public function exportDOCX(Request $request)
    {
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', 'Screenplay');

        // Simple DOCX generation - returns HTML that Word can open
        $docxHTML = $this->wrapForDOCX($html, $title);

        return response($docxHTML, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="' . $title . '.docx"',
        ]);
    }

    public function exportFountain(Request $request)
    {
        $request->validate([
            'html' => 'required|string',
            'title' => 'nullable|string|max:255',
        ]);

        $html = $request->input('html');
        $title = $request->input('title', 'Screenplay');

        $fountain = $this->convertToFountain($html);

        return response($fountain, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="' . $title . '.fountain"',
        ]);
    }

    private function getScreenplayCSS($fontSize, $fontFamily)
    {
        $pt = $fontSize . 'pt';
        $lineHeight = ($fontSize * 1.0) . 'pt';
        
        return <<<CSS
@page {
    size: letter;
    margin: 1in 1.5in 1in 1.5in;
    @bottom-center {
        content: counter(page);
        font-family: {$fontFamily};
        font-size: 10pt;
        color: #666;
    }
}

* {
    box-sizing: border-box;
}

body {
    font-family: '{$fontFamily}', 'Courier New', Courier, monospace;
    font-size: {$pt};
    line-height: {$lineHeight};
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.screenplay-editor-content {
    max-width: 100%;
}

.screenplay-element {
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
}

[data-element-type="scene-heading"] {
    text-transform: uppercase;
    font-weight: 700;
    margin: 24pt 0 12pt 0;
    page-break-after: avoid;
}

[data-element-type="action"] {
    text-align: justify;
    margin: 12pt 0;
    text-indent: 0;
}

[data-element-type="character"] {
    text-transform: uppercase;
    font-weight: 700;
    margin: 12pt 0 0 222pt;
    max-width: 222pt;
    page-break-after: avoid;
}

[data-element-type="parenthetical"] {
    font-style: italic;
    margin: 6pt 0 6pt 186pt;
    max-width: 150pt;
    page-break-after: avoid;
}

[data-element-type="dialogue"] {
    margin: 0 0 12pt 150pt;
    max-width: 252pt;
    page-break-inside: avoid;
}

[data-element-type="transition"] {
    text-transform: uppercase;
    font-weight: 700;
    text-align: right;
    margin: 24pt 0 12pt auto;
    max-width: 360pt;
    page-break-before: avoid;
}

[data-element-type="shot"] {
    font-style: italic;
    text-transform: uppercase;
    margin: 12pt 0;
}

.page-break {
    page-break-after: always;
}

@media print {
    body {
        margin: 0;
        padding: 0;
    }
    [data-element-type] {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .no-print {
        display: none !important;
    }
}
CSS;
    }

    private function generatePDF($html, $title)
    {
        $tempDir = storage_path('app/temp');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $pdfFile = $tempDir . '/' . uniqid('screenplay_') . '.pdf';

        // 1. Try DomPDF (best quality, works on all servers)
        try {
            /** @var DomPDF $dompdf */
            $dompdf = app(DomPDF::class);
            $dompdf->loadHTML($html);
            $dompdf->setPaper('letter');
            $dompdf->render();
            file_put_contents($pdfFile, $dompdf->output());
            if (File::exists($pdfFile) && filesize($pdfFile) > 1000) {
                return $pdfFile;
            }
        } catch (\Exception $e) {
            // DomPDF failed, try fallback
        }

        $htmlFile = $tempDir . '/' . uniqid('screenplay_') . '.html';
        File::put($htmlFile, $html);

        // 2. Chrome headless (fallback)
        $commands = [
            "google-chrome-stable --headless --disable-gpu --no-sandbox --print-to-pdf={$pdfFile} {$htmlFile}",
            "chromium --headless --disable-gpu --no-sandbox --print-to-pdf={$pdfFile} {$htmlFile}",
            "chromium-browser --headless --disable-gpu --no-sandbox --print-to-pdf={$pdfFile} {$htmlFile}",
            // 3. wkhtmltopdf (last fallback)
            "wkhtmltopdf --page-size Letter --margin-top 1in --margin-bottom 1in --margin-left 1.5in --margin-right 1.5in --encoding utf-8 {$htmlFile} {$pdfFile}",
        ];

        foreach ($commands as $cmd) {
            $result = shell_exec($cmd . ' 2>&1');
            if (File::exists($pdfFile) && filesize($pdfFile) > 1000) {
                @unlink($htmlFile);
                return $pdfFile;
            }
        }

        // Cleanup
        @unlink($htmlFile);
        @unlink($pdfFile);

        return null;
    }

    private function wrapForDOCX($html, $title)
    {
        // Word can open HTML files with .docx extension
        // For true DOCX, would need a library like PhpOffice\PhpWord
        return <<<HTML
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>{$title}</title>
    <style>
        @page { size: letter; margin: 1in 1.5in; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.0; }
        [data-element-type="scene-heading"] { text-transform: uppercase; font-weight: bold; margin: 24pt 0 12pt 0; page-break-after: avoid; }
        [data-element-type="action"] { text-align: justify; margin: 12pt 0; }
        [data-element-type="character"] { text-transform: uppercase; font-weight: bold; margin: 12pt 0 0 222pt; max-width: 222pt; page-break-after: avoid; }
        [data-element-type="parenthetical"] { font-style: italic; margin: 6pt 0 6pt 186pt; max-width: 150pt; page-break-after: avoid; }
        [data-element-type="dialogue"] { margin: 0 0 12pt 150pt; max-width: 252pt; page-break-inside: avoid; }
        [data-element-type="transition"] { text-transform: uppercase; font-weight: bold; text-align: right; margin: 24pt 0 12pt auto; max-width: 360pt; page-break-before: avoid; }
    </style>
    <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
</head>
<body>
    {$html}
</body>
</html>
HTML;
    }

    private function convertToFountain($html)
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8"?>' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);
        $elements = $xpath->query('//*[@data-element-type]');

        $fountain = '';
        foreach ($elements as $el) {
            $type = $el->getAttribute('data-element-type');
            $text = trim($el->textContent);
            
            if (empty($text)) continue;

            switch ($type) {
                case 'scene-heading':
                    $fountain .= strtoupper($text) . "\n\n";
                    break;
                case 'character':
                    $fountain .= strtoupper($text) . "\n";
                    break;
                case 'parenthetical':
                    $fountain .= "({$text})\n";
                    break;
                case 'dialogue':
                    $fountain .= $text . "\n\n";
                    break;
                case 'transition':
                    $fountain .= strtoupper($text) . "\n\n";
                    break;
                case 'shot':
                    $fountain .= $text . "\n\n";
                    break;
                default:
                    $fountain .= $text . "\n\n";
            }
        }

        return $fountain;
    }
}