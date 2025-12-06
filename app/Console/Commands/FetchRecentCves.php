<?php

namespace App\Console\Commands;

use App\Services\CveFeedService;
use App\Services\CveIngestionService;
use Illuminate\Console\Command;

class FetchRecentCves extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cve:fetch-recent 
                            {--limit=20 : Number of CVEs to fetch}
                            {--start=0 : Start index for pagination}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch recent CVEs from NVD and enqueue them for analysis';

    /**
     * Execute the console command.
     */
    public function handle(CveFeedService $feedService, CveIngestionService $ingestionService): int
    {
        $this->info('Fetching recent CVEs from NVD...');

        $limit = (int) $this->option('limit');
        $start = (int) $this->option('start');

        // Fetch CVEs from NVD
        $cves = $feedService->fetchRecent($limit, $start);

        if (empty($cves)) {
            $this->warn('No CVEs fetched from NVD');
            return Command::SUCCESS;
        }

        $this->info("Fetched " . count($cves) . " CVEs from NVD");

        // Ingest CVEs
        $this->info('Ingesting CVEs...');
        $progressBar = $this->output->createProgressBar(count($cves));
        $progressBar->start();

        $ingested = 0;
        $queued = 0;

        foreach ($cves as $cveData) {
            try {
                $cve = $ingestionService->ingest($cveData);
                $ingested++;
                
                if ($cve->analysis_status === 'pending') {
                    $queued++;
                }
                
                $progressBar->advance();
            } catch (\Exception $e) {
                $this->error("\nError ingesting CVE: " . $e->getMessage());
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info("✓ Ingested {$ingested} CVEs");
        $this->info("✓ Queued {$queued} CVEs for analysis");

        return Command::SUCCESS;
    }
}
