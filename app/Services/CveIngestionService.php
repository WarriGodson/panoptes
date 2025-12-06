<?php

namespace App\Services;

use App\Models\Cve;
use App\Jobs\AnalyzeCveJob;
use Illuminate\Support\Facades\Log;

class CveIngestionService
{
    /**
     * Ingest a CVE from normalized data
     * 
     * @param array $cveData Normalized CVE data from CveFeedService
     * @return Cve The created or updated CVE model
     */
    public function ingest(array $cveData): Cve
    {
        // Normalize CVE ID to uppercase
        $cveId = strtoupper($cveData['cve_id']);

        // Find existing or create new CVE record
        $existingCve = Cve::where('cve_id', $cveId)->first();
        
        $needsAnalysis = false;

        if ($existingCve) {
            // Check if the CVE has been modified since last ingestion
            $lastModified = $cveData['last_modified_at'] ?? null;
            
            if ($lastModified && $existingCve->last_modified_at) {
                $existingModified = $existingCve->last_modified_at->toIso8601String();
                
                if ($lastModified !== $existingModified) {
                    $needsAnalysis = true;
                    Log::info("CVE {$cveId} has been modified, queuing for re-analysis");
                }
            }
        } else {
            $needsAnalysis = true;
            Log::info("New CVE {$cveId} detected, queuing for analysis");
        }

        // Update or create the CVE record
        $cve = Cve::updateOrCreate(
            ['cve_id' => $cveId],
            [
                'source' => 'nvd',
                'raw_data' => $cveData['raw'] ?? null,
                'published_at' => $cveData['published_at'] ?? null,
                'last_modified_at' => $cveData['last_modified_at'] ?? null,
                'cvss_score' => $cveData['cvss_score'] ?? null,
                'cvss_vector' => $cveData['cvss_vector'] ?? null,
                'analysis_status' => $needsAnalysis ? 'pending' : ($existingCve->analysis_status ?? 'pending'),
            ]
        );

        // Dispatch analysis job if needed
        if ($needsAnalysis && $cve->analysis_status === 'pending') {
            AnalyzeCveJob::dispatch($cve);
        }

        return $cve;
    }

    /**
     * Batch ingest multiple CVEs
     * 
     * @param array $cvesData Array of normalized CVE data
     * @return array Array of ingested CVE models
     */
    public function ingestBatch(array $cvesData): array
    {
        $ingested = [];

        foreach ($cvesData as $cveData) {
            try {
                $ingested[] = $this->ingest($cveData);
            } catch (\Exception $e) {
                Log::error('Error ingesting CVE', [
                    'cve_id' => $cveData['cve_id'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $ingested;
    }
}
