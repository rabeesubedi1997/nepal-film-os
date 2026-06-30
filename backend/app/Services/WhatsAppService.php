<?php

namespace App\Services;

use App\Models\CallSheet;
use App\Models\CallSheetEntry;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $twilioNumber = '';
    protected string $twilioSid = '';
    protected string $twilioToken = '';

    public function __construct()
    {
        $this->twilioNumber = config('services.twilio.whatsapp_number', '');
        $this->twilioSid = config('services.twilio.sid', '');
        $this->twilioToken = config('services.twilio.token', '');
    }

    public function sendCallSheet(CallSheet $callSheet): array
    {
        $results = [];
        $entries = $callSheet->entries()->with('castCrew')->get();

        foreach ($entries as $entry) {
            $phone = $entry->castCrew?->whatsapp;
            if (!$phone) continue;

            $message = $this->buildCallSheetMessage($callSheet, $entry);
            $result = $this->send($phone, $message);
            $results[] = ['entry_id' => $entry->id, 'phone' => $phone, 'sent' => $result];
        }

        return $results;
    }

    protected function buildCallSheetMessage(CallSheet $callSheet, CallSheetEntry $entry): string
    {
        $date = $callSheet->shoot_date ? $callSheet->shoot_date->format('D, M d, Y') : '—';
        return "🎬 CALL SHEET - {$date}\n"
            . "Call Time: {$entry->call_time}\n"
            . "Location: {$callSheet->location?->name}\n"
            . "{$callSheet->schedule?->scenes?->pluck('scene_heading')->implode(', ')}\n"
            . "Catering: {$callSheet->catering_info}";
    }

    protected function send(string $to, string $message): bool
    {
        if (!$this->twilioSid || !$this->twilioToken) {
            Log::info("[WhatsAppService] Twilio not configured. Would send to {$to}: {$message}");
            return false;
        }

        try {
            $response = Http::withBasicAuth($this->twilioSid, $this->twilioToken)
                ->post("https://api.twilio.com/2010-04-01/Accounts/{$this->twilioSid}/Messages.json", [
                    'From' => "whatsapp:{$this->twilioNumber}",
                    'To' => "whatsapp:{$to}",
                    'Body' => $message,
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("[WhatsAppService] Failed to send to {$to}: {$e->getMessage()}");
            return false;
        }
    }
}
