/* Professional Screenplay Formatting - Celtx/Final Draft Standards */
/* Courier 12pt = 16px at 96dpi, but we use pt for print accuracy */

.screenplay-editor {
  font-family: 'Courier Prime', 'Courier New', Courier, monospace;
  font-size: 12pt;
  line-height: 1.0;
  color: #000;
  background: #fff;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 1in 1.5in 1in 1.5in;
  min-height: 11in;
  box-sizing: border-box;
}

/* Screenplay Element Base */
.screenplay-element {
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 12pt;
  line-height: 1.0;
}

/* SCENE HEADING (Slugline) - 1.5" from left, 6" wide, ALL CAPS */
/* Industry: 1.5" left margin, 6" width, 1.5" right margin */
.screenplay-scene-heading {
  margin: 24pt 0 12pt 0;
  text-transform: uppercase;
  font-weight: bold;
  text-indent: 0;
  padding-left: 0;
  page-break-after: avoid;
}

/* ACTION - 1.5" from left, 6" wide */
.screenplay-action {
  margin: 12pt 0 12pt 0;
  text-indent: 0;
  text-align: justify;
  widows: 2;
  orphans: 2;
}

/* CHARACTER - 3.7" from left, 3.7" wide, ALL CAPS */
/* Industry: 3.7" left margin (22 picas), 3.7" width */
.screenplay-character {
  margin: 12pt 0 0 222pt;
  max-width: 222pt;
  text-transform: uppercase;
  font-weight: bold;
  text-indent: 0;
  page-break-after: avoid;
}

/* PARENTHETICAL - 3.1" from left, 2.5" wide */
/* Industry: 3.1" left margin (18.6 picas), 2.5" width */
.screenplay-parenthetical {
  margin: 6pt 0 6pt 186pt;
  max-width: 150pt;
  font-style: italic;
  text-indent: 0;
  page-break-after: avoid;
}

/* DIALOGUE - 2.5" from left, 3.5" wide */
/* Industry: 2.5" left margin (15 picas), 3.5" width */
.screenplay-dialogue {
  margin: 0 0 12pt 150pt;
  max-width: 252pt;
  text-indent: 0;
  text-align: left;
  widows: 2;
  orphans: 2;
}

/* TRANSITION - 6" from left, right-aligned */
/* Industry: 6" left margin (36 picas), right-aligned */
.screenplay-transition {
  margin: 24pt 0 12pt auto;
  text-align: right;
  text-transform: uppercase;
  font-weight: bold;
  text-indent: 0;
  max-width: 360pt;
  page-break-before: avoid;
}

/* SHOT - 1.5" from left, like action but with shot notation */
.screenplay-shot {
  margin: 12pt 0 12pt 0;
  text-indent: 0;
  font-style: italic;
  text-transform: uppercase;
}

/* GENERAL / UNKNOWN */
.screenplay-general {
  margin: 12pt 0;
  text-indent: 0;
}

/* Scene Numbers - right side of scene heading */
.screenplay-scene-number {
  float: right;
  margin-left: 12pt;
  font-weight: normal;
  color: #666;
}

/* Page Break */
.screenplay-page-break {
  page-break-after: always;
  height: 0;
  margin: 0;
  border: none;
}

/* CONTINUED markers */
.screenplay-continued {
  text-align: center;
  margin: 12pt 0;
  font-size: 10pt;
  color: #666;
}

/* MORE / CONT'D for dialogue */
.screenplay-more {
  text-align: right;
  margin: 0 0 6pt 150pt;
  max-width: 252pt;
  font-size: 10pt;
  color: #666;
}

.screenplay-contd {
  text-align: left;
  margin: 6pt 0 0 150pt;
  max-width: 252pt;
  font-size: 10pt;
  color: #666;
}

/* Dual Dialogue - side by side */
.screenplay-dual-dialogue {
  display: flex;
  gap: 24pt;
}
.screenplay-dual-dialogue .screenplay-character {
  margin-left: 0;
  flex: 1;
}
.screenplay-dual-dialogue .screenplay-dialogue {
  margin-left: 0;
  flex: 1;
}

/* Print Styles */
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

/* Selection highlight */
.screenplay-editor ::selection {
  background: rgba(255, 193, 7, 0.3);
}

/* Focus line highlight */
.screenplay-editor .screenplay-element:focus-within {
  background: rgba(255, 193, 7, 0.05);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .screenplay-editor.dark {
    background: #1e1e1e;
    color: #e0e0e0;
  }
}

/* RTL support for Arabic/Hebrew */
.screenplay-editor[dir="rtl"] .screenplay-character,
.screenplay-editor[dir="rtl"] .screenplay-dialogue,
.screenplay-editor[dir="rtl"] .screenplay-parenthetical {
  text-align: right;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .screenplay-element {
    border-left: 2px solid currentColor;
    padding-left: 6pt;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .screenplay-element {
    transition: none;
  }
}

/* Scrollbar styling */
.screenplay-editor::-webkit-scrollbar {
  width: 8px;
}
.screenplay-editor::-webkit-scrollbar-track {
  background: transparent;
}
.screenplay-editor::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.screenplay-editor::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}