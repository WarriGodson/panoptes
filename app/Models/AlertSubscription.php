<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlertSubscription extends Model
{
    protected $fillable = [
        'chat_id',
        'chat_type',
        'keywords',
        'min_severity',
        'enabled',
    ];

    protected $casts = [
        'keywords' => 'array',
        'enabled' => 'boolean',
    ];

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    public function addKeyword(string $keyword): void
    {
        $keywords = $this->keywords ?? [];
        if (!in_array($keyword, $keywords)) {
            $keywords[] = $keyword;
            $this->update(['keywords' => $keywords]);
        }
    }

    public function removeKeyword(string $keyword): void
    {
        $keywords = $this->keywords ?? [];
        $keywords = array_values(array_filter($keywords, fn($k) => $k !== $keyword));
        $this->update(['keywords' => $keywords]);
    }
}
