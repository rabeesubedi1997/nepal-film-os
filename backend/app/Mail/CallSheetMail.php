<?php
namespace App\Mail;

use App\Models\CallSheet;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CallSheetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $callSheet;

    public function __construct(CallSheet $callSheet)
    {
        $this->callSheet = $callSheet;
    }

    public function build()
    {
        $pdf = Pdf::loadView('pdfs.call-sheet', [
            'callSheet' => $this->callSheet,
            'film' => $this->callSheet->film,
            'schedule' => $this->callSheet->schedule,
            'location' => $this->callSheet->location,
            'entries' => $this->callSheet->entries,
        ]);

        $filmName = $this->callSheet->film->title;
        $date = $this->callSheet->shoot_date;

        return $this->subject("Call Sheet: {$filmName} - {$date}")
            ->view('emails.call-sheet')
            ->attachData($pdf->output(), "call-sheet-{$date}.pdf", [
                'mime' => 'application/pdf',
            ]);
    }
}
