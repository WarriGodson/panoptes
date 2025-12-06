<?php

namespace App\Services;

use App\Models\Cve;
use App\Models\AlertSubscription;
use Illuminate\Support\Facades\Log;

class AlertEngineService
{
    private TelegramBotService $telegramService;

    public function __construct(TelegramBotService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * Process a CVE and send alerts to matching subscriptions
     * 
     * @param Cve $cve
     * @return void
     */
    public function processCve(Cve $cve): void
    {
        // Only process completed analyses
        if (!$cve->isAnalysisComplete()) {
            return;
        }

        // Get all enabled subscriptions
        $subscriptions = AlertSubscription::enabled()->get();

        foreach ($subscriptions as $subscription) {
            if ($this->shouldAlert($cve, $subscription)) {
                $this->sendAlert($cve, $subscription);
            }
        }
    }

    /**
     * Determine if an alert should be sent based on subscription criteria
     * 
     * @param Cve $cve
     * @param AlertSubscription $subscription
     * @return bool
     */
    private function shouldAlert(Cve $cve, AlertSubscription $subscription): bool
    {
        // Check severity threshold
        if (!$this->meetsSeverityThreshold($cve->severity, $subscription->min_severity)) {
            return false;
        }

        // Check keyword matches
        $keywords = $subscription->keywords ?? [];
        
        if (empty($keywords)) {
            // No keywords means alert on all CVEs that meet severity threshold
            return true;
        }

        return $this->matchesKeywords($cve, $keywords);
    }

    /**
     * Check if CVE severity meets the subscription's minimum threshold
     * 
     * @param string|null $cveSeverity
     * @param string $minSeverity
     * @return bool
     */
    private function meetsSeverityThreshold(?string $cveSeverity, string $minSeverity): bool
    {
        $severityLevels = [
            'Low' => 1,
            'Medium' => 2,
            'High' => 3,
            'Critical' => 4,
        ];

        $cveLevel = $severityLevels[$cveSeverity] ?? 0;
        $minLevel = $severityLevels[$minSeverity] ?? 0;

        return $cveLevel >= $minLevel;
    }

    /**
     * Check if CVE matches any of the subscription keywords
     * 
     * @param Cve $cve
     * @param array $keywords
     * @return bool
     */
    private function matchesKeywords(Cve $cve, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            $keyword = strtolower($keyword);

            // Check in affected products
            $affectedProducts = $cve->affected_products ?? [];
            foreach ($affectedProducts as $product) {
                if (str_contains(strtolower($product), $keyword)) {
                    return true;
                }
            }

            // Check in summary
            if ($cve->summary && str_contains(strtolower($cve->summary), $keyword)) {
                return true;
            }

            // Check in raw vendor/product data
            $rawData = $cve->raw_data ?? [];
            $configurations = $rawData['configurations'] ?? [];
            
            foreach ($configurations as $config) {
                $nodes = $config['nodes'] ?? [];
                foreach ($nodes as $node) {
                    $cpeMatches = $node['cpeMatch'] ?? [];
                    foreach ($cpeMatches as $match) {
                        $criteria = strtolower($match['criteria'] ?? '');
                        if (str_contains($criteria, $keyword)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Send an alert for a CVE to a subscription
     * 
     * @param Cve $cve
     * @param AlertSubscription $subscription
     * @return void
     */
    private function sendAlert(Cve $cve, AlertSubscription $subscription): void
    {
        try {
            $message = $this->formatAlertMessage($cve);

            if ($subscription->chat_type === 'telegram') {
                $this->telegramService->sendMessage($subscription->chat_id, $message, [
                    'parse_mode' => 'Markdown',
                    'disable_web_page_preview' => true,
                ]);

                Log::info("Alert sent for CVE {$cve->cve_id} to chat {$subscription->chat_id}");
            }

        } catch (\Exception $e) {
            Log::error('Error sending alert', [
                'cve_id' => $cve->cve_id,
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Format the alert message for a CVE
     * 
     * @param Cve $cve
     * @return string
     */
    private function formatAlertMessage(Cve $cve): string
    {
        $severityEmoji = $this->getSeverityEmoji($cve->severity);
        
        $message = "{$severityEmoji} *New {$cve->severity} CVE Detected*\n";
        $message .= "`{$cve->cve_id}` – {$cve->type}\n\n";
        $message .= "{$cve->summary}\n\n";

        // Affected products (show top 2)
        $affectedProducts = $cve->affected_products ?? [];
        if (!empty($affectedProducts)) {
            $topProducts = array_slice($affectedProducts, 0, 2);
            $message .= "*Affected:* " . implode(', ', $topProducts);
            
            if (count($affectedProducts) > 2) {
                $message .= " (+" . (count($affectedProducts) - 2) . " more)";
            }
            $message .= "\n";
        }

        // Exploit likelihood
        $message .= "*Exploit likelihood:* {$cve->exploit_likelihood}\n";

        // CVSS Score
        if ($cve->cvss_score) {
            $message .= "*CVSS Score:* {$cve->cvss_score}\n";
        }

        // Recommended actions (show top 2)
        $recommendedActions = $cve->recommended_actions ?? [];
        if (!empty($recommendedActions)) {
            $message .= "\n*Recommended actions:*\n";
            $topActions = array_slice($recommendedActions, 0, 2);
            foreach ($topActions as $action) {
                $message .= "• {$action}\n";
            }
        }

        $message .= "\n_Use /cve {$cve->cve_id} for full details._";

        return $message;
    }

    /**
     * Get emoji for severity level
     * 
     * @param string|null $severity
     * @return string
     */
    private function getSeverityEmoji(?string $severity): string
    {
        return match ($severity) {
            'Critical' => '🚨',
            'High' => '⚠️',
            'Medium' => '⚡',
            'Low' => 'ℹ️',
            default => '📢',
        };
    }
}
