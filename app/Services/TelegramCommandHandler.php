<?php

namespace App\Services;

use App\Models\AlertSubscription;
use App\Models\Cve;
use Illuminate\Support\Facades\Log;

class TelegramCommandHandler
{
    private TelegramBotService $botService;

    public function __construct(TelegramBotService $botService)
    {
        $this->botService = $botService;
    }

    /**
     * Handle an incoming message
     * 
     * @param array $message
     * @return void
     */
    public function handleMessage(array $message): void
    {
        $chatId = (string) ($message['chat']['id'] ?? null);
        $text = $message['text'] ?? '';

        if (!$chatId) {
            return;
        }

        // Parse command
        if (str_starts_with($text, '/')) {
            $this->handleCommand($chatId, $text);
        }
    }

    /**
     * Handle a command
     * 
     * @param string $chatId
     * @param string $text
     * @return void
     */
    private function handleCommand(string $chatId, string $text): void
    {
        $parts = explode(' ', trim($text), 3);
        $command = strtolower($parts[0]);

        match ($command) {
            '/start' => $this->handleStart($chatId),
            '/help' => $this->handleHelp($chatId),
            '/subscribe' => $this->handleSubscribe($chatId, $parts),
            '/unsubscribe' => $this->handleUnsubscribe($chatId, $parts),
            '/subscriptions' => $this->handleListSubscriptions($chatId),
            '/setseverity' => $this->handleSetSeverity($chatId, $parts),
            '/latest' => $this->handleLatest($chatId),
            '/cve' => $this->handleCveDetails($chatId, $parts),
            default => $this->handleUnknown($chatId),
        };
    }

    private function handleStart(string $chatId): void
    {
        $message = "*Welcome to Panoptes CVE Alert Bot!* 🛡️\n\n";
        $message .= "I monitor new CVEs and send you alerts based on your preferences.\n\n";
        $message .= "Use /help to see available commands.";

        $this->botService->sendMessage($chatId, $message, ['parse_mode' => 'Markdown']);
    }

    private function handleHelp(string $chatId): void
    {
        $message = "*Available Commands:*\n\n";
        $message .= "*/subscribe keyword <keyword>* - Subscribe to alerts for a vendor/product\n";
        $message .= "  Example: `/subscribe keyword Microsoft`\n\n";
        $message .= "*/unsubscribe keyword <keyword>* - Remove a keyword subscription\n";
        $message .= "  Example: `/unsubscribe keyword Microsoft`\n\n";
        $message .= "*/subscriptions* - View your current subscriptions\n\n";
        $message .= "*/setseverity <level>* - Set minimum severity (Low/Medium/High/Critical)\n";
        $message .= "  Example: `/setseverity High`\n\n";
        $message .= "*/latest* - Show latest analyzed CVEs\n\n";
        $message .= "*/cve <CVE-ID>* - Get detailed info about a specific CVE\n";
        $message .= "  Example: `/cve CVE-2025-12345`\n\n";
        $message .= "*/help* - Show this help message";

        $this->botService->sendMessage($chatId, $message, ['parse_mode' => 'Markdown']);
    }

    private function handleSubscribe(string $chatId, array $parts): void
    {
        if (count($parts) < 3) {
            $this->botService->sendMessage(
                $chatId,
                "Usage: /subscribe keyword <keyword>\nExample: /subscribe keyword Microsoft"
            );
            return;
        }

        $type = strtolower($parts[1]);
        $value = $parts[2];

        if ($type !== 'keyword') {
            $this->botService->sendMessage($chatId, "Only 'keyword' subscriptions are supported currently.");
            return;
        }

        $subscription = AlertSubscription::firstOrCreate(
            ['chat_id' => $chatId, 'chat_type' => 'telegram'],
            ['keywords' => [], 'min_severity' => 'High', 'enabled' => true]
        );

        $subscription->addKeyword($value);

        $this->botService->sendMessage(
            $chatId,
            "✓ Subscribed to alerts for: *{$value}*",
            ['parse_mode' => 'Markdown']
        );
    }

    private function handleUnsubscribe(string $chatId, array $parts): void
    {
        if (count($parts) < 3) {
            $this->botService->sendMessage(
                $chatId,
                "Usage: /unsubscribe keyword <keyword>\nExample: /unsubscribe keyword Microsoft"
            );
            return;
        }

        $type = strtolower($parts[1]);
        $value = $parts[2];

        if ($type !== 'keyword') {
            $this->botService->sendMessage($chatId, "Only 'keyword' subscriptions are supported currently.");
            return;
        }

        $subscription = AlertSubscription::where('chat_id', $chatId)
            ->where('chat_type', 'telegram')
            ->first();

        if (!$subscription) {
            $this->botService->sendMessage($chatId, "You have no active subscriptions.");
            return;
        }

        $subscription->removeKeyword($value);

        $this->botService->sendMessage(
            $chatId,
            "✓ Unsubscribed from alerts for: *{$value}*",
            ['parse_mode' => 'Markdown']
        );
    }

    private function handleListSubscriptions(string $chatId): void
    {
        $subscription = AlertSubscription::where('chat_id', $chatId)
            ->where('chat_type', 'telegram')
            ->first();

        if (!$subscription) {
            $this->botService->sendMessage($chatId, "You have no active subscriptions.\n\nUse /subscribe keyword <keyword> to start.");
            return;
        }

        $message = "*Your Subscriptions:*\n\n";
        $message .= "*Minimum Severity:* {$subscription->min_severity}\n";
        $message .= "*Status:* " . ($subscription->enabled ? "Enabled ✅" : "Disabled ❌") . "\n\n";

        $keywords = $subscription->keywords ?? [];
        if (empty($keywords)) {
            $message .= "*Keywords:* None (receiving all CVEs above severity threshold)\n";
        } else {
            $message .= "*Keywords:*\n";
            foreach ($keywords as $keyword) {
                $message .= "• {$keyword}\n";
            }
        }

        $this->botService->sendMessage($chatId, $message, ['parse_mode' => 'Markdown']);
    }

    private function handleSetSeverity(string $chatId, array $parts): void
    {
        if (count($parts) < 2) {
            $this->botService->sendMessage(
                $chatId,
                "Usage: /setseverity <level>\nLevels: Low, Medium, High, Critical\nExample: /setseverity High"
            );
            return;
        }

        $severity = ucfirst(strtolower($parts[1]));
        $validSeverities = ['Low', 'Medium', 'High', 'Critical'];

        if (!in_array($severity, $validSeverities)) {
            $this->botService->sendMessage(
                $chatId,
                "Invalid severity level. Must be one of: Low, Medium, High, Critical"
            );
            return;
        }

        $subscription = AlertSubscription::firstOrCreate(
            ['chat_id' => $chatId, 'chat_type' => 'telegram'],
            ['keywords' => [], 'min_severity' => 'High', 'enabled' => true]
        );

        $subscription->update(['min_severity' => $severity]);

        $this->botService->sendMessage(
            $chatId,
            "✓ Minimum severity set to: *{$severity}*",
            ['parse_mode' => 'Markdown']
        );
    }

    private function handleLatest(string $chatId): void
    {
        $this->botService->sendChatAction($chatId, 'typing');

        $cves = Cve::where('analysis_status', 'complete')
            ->orderBy('published_at', 'desc')
            ->limit(5)
            ->get();

        if ($cves->isEmpty()) {
            $this->botService->sendMessage($chatId, "No analyzed CVEs available yet.");
            return;
        }

        $message = "*Latest Analyzed CVEs:*\n\n";

        foreach ($cves as $cve) {
            $emoji = match ($cve->severity) {
                'Critical' => '🚨',
                'High' => '⚠️',
                'Medium' => '⚡',
                'Low' => 'ℹ️',
                default => '📢',
            };

            $message .= "{$emoji} `{$cve->cve_id}` - *{$cve->severity}* ({$cve->type})\n";
            $summary = substr($cve->summary, 0, 100);
            if (strlen($cve->summary) > 100) {
                $summary .= '...';
            }
            $message .= "{$summary}\n\n";
        }

        $message .= "_Use /cve <CVE-ID> for full details._";

        $this->botService->sendMessage($chatId, $message, ['parse_mode' => 'Markdown']);
    }

    private function handleCveDetails(string $chatId, array $parts): void
    {
        if (count($parts) < 2) {
            $this->botService->sendMessage(
                $chatId,
                "Usage: /cve <CVE-ID>\nExample: /cve CVE-2025-12345"
            );
            return;
        }

        $this->botService->sendChatAction($chatId, 'typing');

        $cveId = strtoupper(trim($parts[1]));

        $cve = Cve::where('cve_id', $cveId)->first();

        if (!$cve) {
            $this->botService->sendMessage($chatId, "CVE not found: {$cveId}");
            return;
        }

        if (!$cve->isAnalysisComplete()) {
            $this->botService->sendMessage(
                $chatId,
                "CVE {$cveId} is still being analyzed. Please check back later."
            );
            return;
        }

        $emoji = match ($cve->severity) {
            'Critical' => '🚨',
            'High' => '⚠️',
            'Medium' => '⚡',
            'Low' => 'ℹ️',
            default => '📢',
        };

        $message = "{$emoji} *{$cve->cve_id}*\n\n";
        $message .= "*Type:* {$cve->type}\n";
        $message .= "*Severity:* {$cve->severity}\n";
        
        if ($cve->cvss_score) {
            $message .= "*CVSS Score:* {$cve->cvss_score}\n";
        }
        
        $message .= "*Exploit Likelihood:* {$cve->exploit_likelihood}\n";
        
        if ($cve->published_at) {
            $message .= "*Published:* {$cve->published_at->format('Y-m-d')}\n";
        }
        
        $message .= "\n*Summary:*\n{$cve->summary}\n";

        $affectedProducts = $cve->affected_products ?? [];
        if (!empty($affectedProducts)) {
            $message .= "\n*Affected Products:*\n";
            foreach (array_slice($affectedProducts, 0, 5) as $product) {
                $message .= "• {$product}\n";
            }
            if (count($affectedProducts) > 5) {
                $message .= "... and " . (count($affectedProducts) - 5) . " more\n";
            }
        }

        $recommendedActions = $cve->recommended_actions ?? [];
        if (!empty($recommendedActions)) {
            $message .= "\n*Recommended Actions:*\n";
            foreach ($recommendedActions as $action) {
                $message .= "• {$action}\n";
            }
        }

        $this->botService->sendMessage($chatId, $message, ['parse_mode' => 'Markdown']);
    }

    private function handleUnknown(string $chatId): void
    {
        $this->botService->sendMessage(
            $chatId,
            "Unknown command. Use /help to see available commands."
        );
    }
}
