<?php

namespace App\Services;

use App\Models\Cve;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CveAnalysisService
{
    private string $apiKey;
    private string $model;

    public function __construct()
    {
        $this->apiKey = config('services.openai.key');
        $this->model = config('services.openai.model');
    }

    /**
     * Analyze a CVE using AI/LLM
     * 
     * @param Cve $cve The CVE to analyze
     * @return void
     */
    public function analyze(Cve $cve): void
    {
        if (!$this->apiKey) {
            Log::error('OpenAI API key not configured');
            $cve->markAnalysisFailed();
            return;
        }

        try {
            // Build the prompt with CVE data
            $prompt = $this->buildPrompt($cve);

            // Call OpenAI API
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->withOptions(['verify' => false]) // Disable SSL verification for local dev
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $this->getSystemPrompt(),
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 2000,
                ]);

            if (!$response->successful()) {
                Log::error('OpenAI API request failed', [
                    'cve_id' => $cve->cve_id,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                $cve->markAnalysisFailed();
                return;
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                Log::error('No content in OpenAI response', ['cve_id' => $cve->cve_id]);
                $cve->markAnalysisFailed();
                return;
            }

            // Parse JSON response
            $analysis = $this->parseAnalysis($content);

            if (!$analysis) {
                Log::error('Failed to parse AI analysis', [
                    'cve_id' => $cve->cve_id,
                    'content' => $content,
                ]);
                $cve->markAnalysisFailed();
                return;
            }

            // Update CVE with analysis
            $cve->update([
                'summary' => $analysis['summary'] ?? null,
                'type' => $analysis['type'] ?? null,
                'severity' => $analysis['severity'] ?? null,
                'affected_products' => $analysis['affected_products'] ?? [],
                'exploit_likelihood' => $analysis['exploit_likelihood'] ?? null,
                'recommended_actions' => $analysis['recommended_actions'] ?? [],
                'analysis_status' => 'complete',
            ]);

            Log::info("Successfully analyzed CVE {$cve->cve_id}");

        } catch (\Exception $e) {
            Log::error('Error analyzing CVE', [
                'cve_id' => $cve->cve_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $cve->markAnalysisFailed();
        }
    }

    /**
     * Get the system prompt for AI analysis
     * 
     * @return string
     */
    private function getSystemPrompt(): string
    {
        return <<<'PROMPT'
You are a cybersecurity assistant focused on DEFENSIVE security.

Your tasks:
1. Summarize the vulnerability in 3–5 sentences in clear, non-technical language.
2. Classify the vulnerability type: e.g. "Remote Code Execution", "Privilege Escalation", "Information Disclosure", "Denial of Service", "Cross-Site Scripting", etc.
3. Estimate severity as one of: "Low", "Medium", "High", "Critical". If CVSS is present, use it as a guide.
4. Identify likely affected products or vendors (e.g. "Microsoft Exchange Server 2019", "Cisco ASA", "Linux kernel").
5. Rate likelihood of exploitation in the wild as: "Low", "Medium", or "High", based on factors like ease of exploitation, exposure surface, and presence of public exploit mentions. DO NOT describe or generate exploit code or attack payloads.
6. Suggest DEFENSIVE mitigation steps: patching, configuration hardening, network restrictions, monitoring rules, etc. Provide only high-level defensive recommendations. DO NOT provide exploitation details or offensive guidance.

Output only valid JSON in the following format:
{
  "summary": "...",
  "type": "...",
  "severity": "Low|Medium|High|Critical",
  "affected_products": ["...", "..."],
  "exploit_likelihood": "Low|Medium|High",
  "recommended_actions": ["...", "..."]
}
PROMPT;
    }

    /**
     * Build the user prompt with CVE data
     * 
     * @param Cve $cve
     * @return string
     */
    private function buildPrompt(Cve $cve): string
    {
        $rawData = $cve->raw_data ?? [];
        
        // Extract description
        $descriptions = $rawData['descriptions'] ?? [];
        $description = 'No description available';
        
        foreach ($descriptions as $desc) {
            if (($desc['lang'] ?? '') === 'en') {
                $description = $desc['value'] ?? $description;
                break;
            }
        }

        // Extract references
        $references = $rawData['references'] ?? [];
        $referenceUrls = array_slice(array_column($references, 'url'), 0, 5);

        $prompt = "CVE ID: {$cve->cve_id}\n\n";
        $prompt .= "Description: {$description}\n\n";
        
        if ($cve->cvss_score) {
            $prompt .= "CVSS Score: {$cve->cvss_score}\n";
        }
        
        if ($cve->cvss_vector) {
            $prompt .= "CVSS Vector: {$cve->cvss_vector}\n";
        }
        
        if (!empty($referenceUrls)) {
            $prompt .= "\nReferences:\n";
            foreach ($referenceUrls as $url) {
                $prompt .= "- {$url}\n";
            }
        }

        $prompt .= "\nPlease analyze this vulnerability and provide your response in the specified JSON format.";

        return $prompt;
    }

    /**
     * Parse the AI response
     * 
     * @param string $content
     * @return array|null
     */
    private function parseAnalysis(string $content): ?array
    {
        // Try to extract JSON from the content
        // Sometimes LLMs wrap JSON in markdown code blocks
        $content = trim($content);
        
        // Remove markdown code blocks if present
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $content, $matches)) {
            $content = $matches[1];
        }

        try {
            $analysis = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
            
            // Validate required fields
            $requiredFields = ['summary', 'type', 'severity', 'affected_products', 'exploit_likelihood', 'recommended_actions'];
            
            foreach ($requiredFields as $field) {
                if (!isset($analysis[$field])) {
                    Log::warning("Missing required field in analysis: {$field}");
                    return null;
                }
            }

            return $analysis;

        } catch (\JsonException $e) {
            Log::error('JSON parse error in AI response', [
                'error' => $e->getMessage(),
                'content' => $content,
            ]);
            return null;
        }
    }
}
