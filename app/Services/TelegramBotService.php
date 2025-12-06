<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramBotService
{
    private string $botToken;
    private string $baseUrl;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
        $this->baseUrl = "https://api.telegram.org/bot{$this->botToken}";
    }

    /**
     * Send a message to a Telegram chat
     * 
     * @param string $chatId The chat ID to send to
     * @param string $text The message text
     * @param array $options Additional options (parse_mode, reply_markup, etc.)
     * @return void
     */
    public function sendMessage(string $chatId, string $text, array $options = []): void
    {
        if (!$this->botToken) {
            Log::error('Telegram bot token not configured');
            return;
        }

        try {
            $params = array_merge([
                'chat_id' => $chatId,
                'text' => $text,
            ], $options);

            $response = Http::timeout(30)
                ->withOptions(['verify' => false]) // Disable SSL verification for local dev
                ->post("{$this->baseUrl}/sendMessage", $params);

            if (!$response->successful()) {
                Log::error('Telegram sendMessage failed', [
                    'chat_id' => $chatId,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error sending Telegram message', [
                'chat_id' => $chatId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get updates from Telegram (for polling)
     * 
     * @param int|null $offset Update offset
     * @param int $limit Maximum number of updates
     * @param int $timeout Long polling timeout in seconds
     * @return array Array of updates
     */
    public function getUpdates(?int $offset = null, int $limit = 100, int $timeout = 30): array
    {
        if (!$this->botToken) {
            return [];
        }

        try {
            $params = [
                'limit' => $limit,
                'timeout' => $timeout,
            ];

            if ($offset !== null) {
                $params['offset'] = $offset;
            }

            $response = Http::timeout($timeout + 10)
                ->withOptions(['verify' => false]) // Disable SSL verification for local dev
                ->get("{$this->baseUrl}/getUpdates", $params);

            if ($response->successful()) {
                $data = $response->json();
                return $data['result'] ?? [];
            }

            return [];

        } catch (\Exception $e) {
            Log::error('Error getting Telegram updates', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Get information about the bot
     * 
     * @return array|null
     */
    public function getMe(): ?array
    {
        if (!$this->botToken) {
            return null;
        }

        try {
            $response = Http::withOptions(['verify' => false])
                ->get("{$this->baseUrl}/getMe");

            if ($response->successful()) {
                $data = $response->json();
                return $data['result'] ?? null;
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Error getting bot info', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Send a chat action (typing, uploading, etc.)
     * 
     * @param string $chatId
     * @param string $action typing, upload_photo, etc.
     * @return void
     */
    public function sendChatAction(string $chatId, string $action = 'typing'): void
    {
        if (!$this->botToken) {
            return;
        }

        try {
            Http::withOptions(['verify' => false])
                ->post("{$this->baseUrl}/sendChatAction", [
                    'chat_id' => $chatId,
                    'action' => $action,
                ]);
        } catch (\Exception $e) {
            // Silently fail for chat actions
        }
    }
}
