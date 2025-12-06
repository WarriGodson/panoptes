<?php

namespace App\Jobs;

use App\Models\Cve;
use App\Services\CveAnalysisService;
use App\Services\AlertEngineService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class AnalyzeCveJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Cve $cve
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(CveAnalysisService $analysisService, AlertEngineService $alertEngine): void
    {
        // Refresh the model to ensure we have the latest data
        $this->cve->refresh();

        // Skip if already analyzed
        if ($this->cve->isAnalysisComplete()) {
            Log::info("CVE {$this->cve->cve_id} already analyzed, skipping");
            return;
        }

        // Perform AI analysis
        Log::info("Starting analysis for CVE {$this->cve->cve_id}");
        $analysisService->analyze($this->cve);

        // Refresh model after analysis
        $this->cve->refresh();

        // If analysis succeeded, process alerts
        if ($this->cve->isAnalysisComplete()) {
            Log::info("Processing alerts for CVE {$this->cve->cve_id}");
            $alertEngine->processCve($this->cve);
        }
    }

    /**
     * Get the number of times the job may be attempted.
     */
    public function tries(): int
    {
        return 3;
    }

    /**
     * Get the number of seconds to wait before retrying the job.
     */
    public function backoff(): array
    {
        return [60, 300, 900]; // 1 min, 5 min, 15 min
    }
}
