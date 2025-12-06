<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cve extends Model
{
    protected $fillable = [
        'cve_id',
        'source',
        'raw_data',
        'published_at',
        'last_modified_at',
        'cvss_score',
        'cvss_vector',
        'summary',
        'type',
        'severity',
        'exploit_likelihood',
        'affected_products',
        'recommended_actions',
        'analysis_status',
    ];

    protected $casts = [
        'raw_data' => 'array',
        'affected_products' => 'array',
        'recommended_actions' => 'array',
        'published_at' => 'datetime',
        'last_modified_at' => 'datetime',
        'cvss_score' => 'decimal:1',
    ];

    public function isPending(): bool
    {
        return $this->analysis_status === 'pending';
    }

    public function isAnalysisComplete(): bool
    {
        return $this->analysis_status === 'complete';
    }

    public function markAnalysisComplete(): void
    {
        $this->update(['analysis_status' => 'complete']);
    }

    public function markAnalysisFailed(): void
    {
        $this->update(['analysis_status' => 'failed']);
    }
}
