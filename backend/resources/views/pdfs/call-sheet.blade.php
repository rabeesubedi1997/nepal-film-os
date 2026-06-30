<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Call Sheet - {{ $callSheet->shoot_date }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 22px; color: #1e293b; }
        .header p { margin: 4px 0 0; font-size: 11px; color: #64748b; }
        .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
        .info-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
        .info-box h3 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
        .info-box p { margin: 0; font-size: 13px; font-weight: bold; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e293b; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
        .badge-completed { background: #d1fae5; color: #065f46; }
        .badge-progress { background: #dbeafe; color: #1e40af; }
        .badge-scheduled { background: #f1f5f9; color: #475569; }
        .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $film->title ?? 'Film' }} — Call Sheet</h1>
        <p>{{ $callSheet->shoot_date ? \Carbon\Carbon::parse($callSheet->shoot_date)->format('l, F j, Y') : 'TBD' }}</p>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div class="info-box">
            <h3>Call Time</h3>
            <p>{{ $callSheet->general_call_time ?? '—' }}</p>
        </div>
        <div class="info-box">
            <h3>Location</h3>
            <p>{{ $location->name ?? ($schedule->location->name ?? '—') }}</p>
        </div>
        <div class="info-box">
            <h3>Weather</h3>
            <p>{{ $callSheet->weather ?? '—' }}</p>
        </div>
        <div class="info-box">
            <h3>Catering</h3>
            <p>{{ $callSheet->catering_info ?? '—' }}</p>
        </div>
    </div>

    @if($callSheet->emergency_info)
    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #fca5a5; border-radius: 6px; background: #fef2f2;">
        <h3 style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: #dc2626;">Emergency Info</h3>
        <p style="margin: 0; font-size: 11px; color: #991b1b;">{{ $callSheet->emergency_info }}</p>
    </div>
    @endif

    @if($callSheet->special_instructions)
    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #fde68a; border-radius: 6px; background: #fffbeb;">
        <h3 style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: #d97706;">Special Instructions</h3>
        <p style="margin: 0; font-size: 11px;">{{ $callSheet->special_instructions }}</p>
    </div>
    @endif

    <h3 style="margin: 0 0 10px; font-size: 13px; color: #1e293b;">Crew Assignments</h3>

    @if($entries->count() > 0)
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Call Time</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($entries as $entry)
            <tr>
                <td>{{ $entry->castCrew->name ?? 'Unknown' }}</td>
                <td>{{ $entry->castCrew->role_name ?? '—' }}</td>
                <td>{{ $entry->call_time ?? $callSheet->general_call_time }}</td>
                <td>{{ $entry->notes ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p style="color: #94a3b8; font-style: italic;">No crew assigned.</p>
    @endif

    @if($schedule && $schedule->scenes->count() > 0)
    <h3 style="margin: 20px 0 10px; font-size: 13px; color: #1e293b;">Scenes for {{ $callSheet->shoot_date }}</h3>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Scene</th>
                <th>INT/EXT</th>
                <th>Day/Night</th>
                <th>Pages</th>
                <th>Location</th>
            </tr>
        </thead>
        <tbody>
            @foreach($schedule->scenes as $scene)
            <tr>
                <td>{{ $scene->scene_number }}</td>
                <td>{{ $scene->scene_heading }}</td>
                <td>{{ $scene->int_ext }}</td>
                <td>{{ $scene->day_or_night }}</td>
                <td>{{ number_format($scene->page_count, 1) }}</td>
                <td>{{ $scene->location->name ?? '—' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>Generated {{ now()->format('F j, Y \a\t g:i A') }} — Nepal Film OS</p>
    </div>
</body>
</html>
