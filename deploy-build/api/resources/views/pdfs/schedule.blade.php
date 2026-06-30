<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shooting Schedule - Day {{ $schedule->day_number }}</title>
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
        <h1>Shooting Schedule — Day {{ $schedule->day_number }}</h1>
        <p>Generated on {{ now()->format('F j, Y') }}</p>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div class="info-box">
            <h3>Shoot Date</h3>
            <p>{{ $schedule->shoot_date ? \Carbon\Carbon::parse($schedule->shoot_date)->format('l, F j, Y') : 'TBD' }}</p>
        </div>
        <div class="info-box">
            <h3>Call Time</h3>
            <p>{{ $schedule->call_time ?? '—' }}</p>
        </div>
        <div class="info-box">
            <h3>Wrap Time</h3>
            <p>{{ $schedule->wrap_time ?? '—' }}</p>
        </div>
        <div class="info-box">
            <h3>Location</h3>
            <p>{{ $schedule->location->name ?? '—' }}</p>
        </div>
    </div>

    <h3 style="margin: 0 0 10px; font-size: 13px; color: #1e293b;">Scenes for Day {{ $schedule->day_number }}</h3>

    @if($schedule->scenes->count() > 0)
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Scene</th>
                <th>INT/EXT</th>
                <th>Day/Night</th>
                <th>Pages</th>
                <th>Location</th>
                <th>Status</th>
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
                <td>
                    <span class="badge badge-{{ strtolower(str_replace(' ', '-', $scene->status)) }}">{{ $scene->status }}</span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <p style="color: #94a3b8; font-style: italic;">No scenes assigned to this shoot day.</p>
    @endif

    @if($schedule->notes)
    <div style="margin-top: 20px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fafafa;">
        <h3 style="margin: 0 0 6px; font-size: 10px; text-transform: uppercase; color: #64748b;">Notes</h3>
        <p style="margin: 0; font-size: 11px;">{{ $schedule->notes }}</p>
    </div>
    @endif

    <div class="footer">
        <p>Nepal Film OS — {{ config('app.name') }}</p>
    </div>
</body>
</html>
