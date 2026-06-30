<?php

namespace App\Jobs;

use App\Models\CallSheet;
use App\Models\Notification;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendCallSheetNotifications implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $unsentSheets = CallSheet::where('is_sent', false)
            ->whereNotNull('sent_at')
            ->get();

        $whatsapp = app(WhatsAppService::class);

        foreach ($unsentSheets as $callSheet) {
            try {
                $whatsapp->sendCallSheet($callSheet);

                $callSheet->update(['is_sent' => true]);

                $callSheet->schedule?->scenes?->each(function ($scene) use ($callSheet) {
                    Notification::create([
                        'user_id' => $callSheet->created_by,
                        'film_id' => $callSheet->film_id,
                        'type' => 'call_sheet_sent',
                        'title' => "Call sheet sent for {$callSheet->shoot_date}",
                        'body' => "Call sheet for Day {$callSheet->schedule?->day_number} has been distributed.",
                    ]);
                });
            } catch (\Exception $e) {
                \Log::error("[SendCallSheetNotifications] Failed for call sheet {$callSheet->id}: {$e->getMessage()}");
            }
        }
    }
}
