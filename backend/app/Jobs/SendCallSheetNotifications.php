<?php

namespace App\Jobs;

use App\Mail\CallSheetMail;
use App\Models\CallSheet;
use App\Models\Notification;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

/**
 * Safety-net job: catches call sheets that were created but never
 * manually distributed (via CallSheetController::distribute) as their
 * shoot day approaches, and sends them automatically.
 *
 * Previously this queried `is_sent = false AND sent_at IS NOT NULL` —
 * every code path that ever set sent_at also set is_sent = true in the
 * same call, so that condition could never match anything. This job ran
 * every 5 minutes (routes/console.php) and was a permanent no-op.
 */
class SendCallSheetNotifications implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $dueSheets = CallSheet::where('is_sent', false)
            ->whereDate('shoot_date', '<=', now()->addDay())
            ->with(['entries.castCrew', 'schedule.scenes', 'location'])
            ->get();

        $whatsapp = app(WhatsAppService::class);

        foreach ($dueSheets as $callSheet) {
            try {
                $emails = $callSheet->entries
                    ->pluck('castCrew.contact_email')
                    ->filter()
                    ->unique();

                foreach ($emails as $email) {
                    Mail::to($email)->send(new CallSheetMail($callSheet));
                }

                $whatsapp->sendCallSheet($callSheet);

                $callSheet->update(['is_sent' => true, 'sent_at' => now()]);

                Notification::create([
                    'user_id' => $callSheet->created_by,
                    'film_id' => $callSheet->film_id,
                    'type' => 'call_sheet_sent',
                    'title' => "Call sheet sent for {$callSheet->shoot_date}",
                    'body' => "Call sheet for Day {$callSheet->schedule?->day_number} has been distributed.",
                ]);
            } catch (\Exception $e) {
                \Log::error("[SendCallSheetNotifications] Failed for call sheet {$callSheet->id}: {$e->getMessage()}");
            }
        }
    }
}
