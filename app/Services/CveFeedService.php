<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CveFeedService
{
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.nvd.base_url');
        $this->apiKey = config('services.nvd.api_key');
    }

    /**
     * Fetch recent CVEs from NVD API
     * 
     * @param int $resultsPerPage Number of results to fetch (default 20, max 2000)
     * @param int $startIndex Starting index for pagination
     * @return array Normalized CVE data
     */
    public function fetchRecent(int $resultsPerPage = 20, int $startIndex = 0): array
    {
        try {
            // TODO: Fine-tune query parameters based on NVD API v2.0 documentation
            // Common parameters: lastModStartDate, lastModEndDate, resultsPerPage, startIndex
            
            $params = [
                'resultsPerPage' => min($resultsPerPage, 2000),
                'startIndex' => $startIndex,
            ];

            // Add API key if configured (improves rate limits)
            $headers = [];
            if ($this->apiKey) {
                $headers['apiKey'] = $this->apiKey;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->withOptions(['verify' => false])
                ->get($this->baseUrl, $params);

            if (!$response->successful()) {
                Log::error('NVD API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $data = $response->json();
            
            return $this->normalizeResponse($data);

        } catch (\Exception $e) {
            Log::error('Error fetching CVEs from NVD', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [];
        }
    }

    /**
     * Normalize NVD API response to our internal format
     * 
     * @param array $data Raw NVD API response
     * @return array Normalized CVE data
     */
    private function normalizeResponse(array $data): array
    {
        $vulnerabilities = $data['vulnerabilities'] ?? [];
        $normalized = [];

        foreach ($vulnerabilities as $item) {
            $cve = $item['cve'] ?? [];
            
            $cveId = $cve['id'] ?? null;
            if (!$cveId) {
                continue;
            }

            // Extract CVSS data (prefer v3.1, fallback to v3.0, then v2.0)
            $cvssScore = null;
            $cvssVector = null;

            $metrics = $cve['metrics'] ?? [];
            
            if (!empty($metrics['cvssMetricV31'])) {
                $cvssData = $metrics['cvssMetricV31'][0]['cvssData'] ?? [];
                $cvssScore = $cvssData['baseScore'] ?? null;
                $cvssVector = $cvssData['vectorString'] ?? null;
            } elseif (!empty($metrics['cvssMetricV30'])) {
                $cvssData = $metrics['cvssMetricV30'][0]['cvssData'] ?? [];
                $cvssScore = $cvssData['baseScore'] ?? null;
                $cvssVector = $cvssData['vectorString'] ?? null;
            } elseif (!empty($metrics['cvssMetricV2'])) {
                $cvssData = $metrics['cvssMetricV2'][0]['cvssData'] ?? [];
                $cvssScore = $cvssData['baseScore'] ?? null;
                $cvssVector = $cvssData['vectorString'] ?? null;
            }

            $normalized[] = [
                'cve_id' => strtoupper($cveId),
                'published_at' => $cve['published'] ?? null,
                'last_modified_at' => $cve['lastModified'] ?? null,
                'cvss_score' => $cvssScore,
                'cvss_vector' => $cvssVector,
                'raw' => $cve,
            ];
        }

        return $normalized;
    }

    /**
     * Fetch CVEs modified within a specific date range
     * 
     * @param string $startDate ISO 8601 date format
     * @param string|null $endDate ISO 8601 date format (defaults to now)
     * @return array Normalized CVE data
     */
    public function fetchByDateRange(string $startDate, ?string $endDate = null): array
    {
        try {
            $params = [
                'lastModStartDate' => $startDate,
                'resultsPerPage' => 100,
            ];

            if ($endDate) {
                $params['lastModEndDate'] = $endDate;
            }

            $headers = [];
            if ($this->apiKey) {
                $headers['apiKey'] = $this->apiKey;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->withOptions(['verify' => false])
                ->get($this->baseUrl, $params);

            if (!$response->successful()) {
                Log::error('NVD API date range request failed', [
                    'status' => $response->status(),
                    'params' => $params,
                ]);
                return [];
            }

            $data = $response->json();
            return $this->normalizeResponse($data);

        } catch (\Exception $e) {
            Log::error('Error fetching CVEs by date range', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }
}
