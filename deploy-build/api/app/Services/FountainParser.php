<?php

namespace App\Services;

class FountainParser
{
    public function parse(string $content): array
    {
        $scenes = [];
        $lines = explode("\n", $content);
        $sceneNumber = 0;
        $inScene = false;
        $sceneBuffer = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($this->isSceneHeading($trimmed)) {
                if ($inScene) {
                    $scenes[] = $this->makeScene($sceneNumber, $sceneBuffer);
                }
                $sceneNumber++;
                $inScene = true;
                $sceneBuffer = [$trimmed];
            } elseif ($inScene) {
                $sceneBuffer[] = $trimmed;
            }
        }

        if ($inScene) {
            $scenes[] = $this->makeScene($sceneNumber, $sceneBuffer);
        }

        return $scenes;
    }

    public function isSceneHeading(string $line): bool
    {
        if (empty($line)) return false;

        if (preg_match('/^(INT|EXT|INT\.\/EXT\.|I\/E|INT\/EXT|INT\/EXT\.|INT\.\/EXT)(\.|\s)/i', $line)) {
            return true;
        }

        return false;
    }

    private function makeScene(int $number, array $lines): array
    {
        $heading = $lines[0] ?? '';
        $contentLines = array_slice($lines, 1);
        $nonEmptyCount = count(array_filter($contentLines, fn($l) => trim($l) !== ''));

        return [
            'scene_number' => (string) $number,
            'scene_heading' => $heading,
            'int_ext' => $this->extractIntExt($heading),
            'day_or_night' => $this->extractDayOrNight($heading),
            'location_name' => $this->extractLocationName($heading),
            'page_count' => round($nonEmptyCount / 55, 2),
            'content' => implode("\n", $contentLines),
        ];
    }

    public function extractLocationName(string $heading): string
    {
        $cleaned = preg_replace('/^(INT\.\/EXT\.|INT\/EXT|I\/E|INT\.|EXT\.|INT|EXT)[\.\s]+/i', '', $heading);
        $cleaned = preg_replace('/\s*[-–—]\s*(DAWN|DAY|DUSK|NIGHT|MORNING|EVENING|AFTERNOON|LATER|CONTINUOUS|MOMENTS?)\s*$/i', '', $cleaned);
        return trim($cleaned);
    }

    private function extractIntExt(string $heading): string
    {
        if (preg_match('/^(INT\.\/EXT\.|INT\/EXT|I\/E|INT\.|EXT\.)/i', $heading, $m)) {
            $val = strtoupper($m[1]);
            return match ($val) {
                'INT./EXT.', 'INT/EXT', 'INT./EXT', 'INT/EXT.', 'I/E' => 'INT/EXT',
                'INT.', 'INT' => 'INT',
                'EXT.', 'EXT' => 'EXT',
                default => 'INT',
            };
        }
        return 'INT';
    }

    private function extractDayOrNight(string $heading): string
    {
        if (preg_match('/\b(DAWN|DAY|DUSK|NIGHT|MORNING|EVENING|AFTERNOON|LATER|CONTINUOUS|MOMENTS?)\b/i', $heading, $m)) {
            return strtoupper($m[1]);
        }
        return 'DAY';
    }
}
