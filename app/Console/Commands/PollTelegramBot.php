<?php

namespace App\Console\Commands;

use App\Services\TelegramBotService;
use App\Services\TelegramCommandHandler;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PollTelegramBot extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bot:poll-telegram';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Poll Telegram for bot updates and process commands';

    private ?int $offset = null;

    /**
     * Execute the console command.
     */
    public function handle(TelegramBotService $botService, TelegramCommandHandler $commandHandler): int
    {
        $this->info('Starting Telegram bot polling...');

        // Test bot connection
        $botInfo = $botService->getMe();
        
        if (!$botInfo) {
            $this->error('Failed to connect to Telegram. Please check your TELEGRAM_BOT_TOKEN.');
            return Command::FAILURE;
        }

        $this->info("Connected as: @{$botInfo['username']}");
        $this->info('Press Ctrl+C to stop polling');
        $this->newLine();

        while (true) {
            try {
                $updates = $botService->getUpdates($this->offset, 100, 30);

                foreach ($updates as $update) {
                    $this->processUpdate($update, $commandHandler);
                    
                    // Update offset to acknowledge this update
                    $this->offset = $update['update_id'] + 1;
                }

            } catch (\Exception $e) {
                $this->error("Error polling Telegram: " . $e->getMessage());
                Log::error('Telegram polling error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                // Wait a bit before retrying
                sleep(5);
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Process a single update
     * 
     * @param array $update
     * @param TelegramCommandHandler $commandHandler
     * @return void
     */
    private function processUpdate(array $update, TelegramCommandHandler $commandHandler): void
    {
        try {
            if (isset($update['message'])) {
                $message = $update['message'];
                $chatId = $message['chat']['id'] ?? null;
                $text = $message['text'] ?? '';
                $username = $message['from']['username'] ?? 'unknown';

                if ($text) {
                    $this->info("[{$username}] {$text}");
                    $commandHandler->handleMessage($message);
                }
            }

        } catch (\Exception $e) {
            $this->error("Error processing update: " . $e->getMessage());
            Log::error('Error processing Telegram update', [
                'update' => $update,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
