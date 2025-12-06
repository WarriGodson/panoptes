<?php

namespace App\Http\Controllers\Api;

use App\Helpers\EnvHelper;
use App\Http\Controllers\Controller;
use App\Services\TelegramBotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;

class SetupController extends Controller
{
    /**
     * Add CORS headers to response
     */
    private function corsResponse($data, $status = 200): JsonResponse
    {
        return response()->json($data, $status)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    }

    /**
     * Get setup status
     */
    public function status(): JsonResponse
    {
        $installed = env('APP_INSTALLED', false) === 'true' || env('APP_INSTALLED', false) === true;

        return $this->corsResponse([
            'installed' => $installed,
            'steps' => [
                'db' => !empty(env('DB_CONNECTION')),
                'openai' => !empty(env('OPENAI_API_KEY')),
                'telegram' => !empty(env('TELEGRAM_BOT_TOKEN')),
            ],
        ]);
    }

    /**
     * Test database connection
     */
    public function testDb(Request $request): JsonResponse
    {
        $request->validate([
            'driver' => 'required|in:sqlite,mysql,pgsql',
            'host' => 'required_if:driver,mysql,pgsql',
            'port' => 'required_if:driver,mysql,pgsql',
            'database' => 'required',
            'username' => 'required_if:driver,mysql,pgsql',
            'password' => 'nullable',
        ]);

        $driver = $request->input('driver');

        try {
            if ($driver === 'sqlite') {
                $database = $request->input('database');
                $dbPath = database_path($database);
                $dir = dirname($dbPath);

                // Check if directory is writable
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }

                if (!is_writable($dir)) {
                    return $this->corsResponse([
                        'ok' => false,
                        'message' => "Directory {$dir} is not writable",
                    ]);
                }

                // Try to create/touch the database file
                if (!file_exists($dbPath)) {
                    touch($dbPath);
                }

                // Test connection
                $testConfig = [
                    'driver' => 'sqlite',
                    'database' => $dbPath,
                ];

            } else {
                // MySQL or PostgreSQL
                $testConfig = [
                    'driver' => $driver,
                    'host' => $request->input('host'),
                    'port' => $request->input('port'),
                    'database' => $request->input('database'),
                    'username' => $request->input('username'),
                    'password' => $request->input('password'),
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix' => '',
                ];
            }

            // Configure temporary connection
            config(['database.connections.test' => $testConfig]);

            // Test the connection
            DB::connection('test')->getPdo();
            DB::connection('test')->select('SELECT 1');

            // Disconnect
            DB::disconnect('test');

            return $this->corsResponse(['ok' => true]);

        } catch (\Exception $e) {
            Log::error('Database test failed', ['error' => $e->getMessage()]);

            return $this->corsResponse([
                'ok' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Test OpenAI API key
     */
    public function testOpenAi(Request $request): JsonResponse
    {
        $request->validate([
            'api_key' => 'required|string',
            'model' => 'required|string',
        ]);

        $apiKey = $request->input('api_key');
        $model = $request->input('model');

        try {
            $response = Http::withToken($apiKey)
                ->withOptions(['verify' => false]) // Disable SSL verification for local development
                ->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => 'Hi',
                        ],
                    ],
                    'max_tokens' => 5,
                ]);

            if ($response->successful()) {
                return $this->corsResponse(['ok' => true]);
            }

            $error = $response->json('error.message', 'API request failed');

            return $this->corsResponse([
                'ok' => false,
                'message' => $error,
            ]);

        } catch (\Exception $e) {
            Log::error('OpenAI test failed', ['error' => $e->getMessage()]);

            return $this->corsResponse([
                'ok' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Test Telegram bot
     */
    public function testTelegram(Request $request): JsonResponse
    {
        $request->validate([
            'bot_token' => 'required|string',
            'chat_id' => 'nullable|string',
        ]);

        $botToken = $request->input('bot_token');
        $chatId = $request->input('chat_id');

        try {
            $baseUrl = "https://api.telegram.org/bot{$botToken}";

            // Test bot token with getMe
            $getMeResponse = Http::withOptions(['verify' => false])->timeout(30)->get("{$baseUrl}/getMe");

            if (!$getMeResponse->successful()) {
                return $this->corsResponse([
                    'ok' => false,
                    'message' => 'Invalid bot token',
                ]);
            }

            $botInfo = $getMeResponse->json('result');
            
            $message = 'Bot token is valid! Bot: @' . ($botInfo['username'] ?? 'unknown');

            // If chat_id is provided, try to send a test message
            if (!empty($chatId)) {
                $sendResponse = Http::withOptions(['verify' => false])->timeout(30)->post("{$baseUrl}/sendMessage", [
                    'chat_id' => $chatId,
                    'text' => "✅ Your Panoptes CVE bot is connected successfully!",
                ]);

                if (!$sendResponse->successful()) {
                    $message .= ' (Note: Could not send test message to chat ID - please verify it later)';
                }
            }

            return $this->corsResponse([
                'ok' => true,
                'message' => $message,
                'bot_username' => $botInfo['username'] ?? null,
            ]);

        } catch (\Exception $e) {
            Log::error('Telegram test failed', ['error' => $e->getMessage()]);

            return $this->corsResponse([
                'ok' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Save setup configuration
     */
    public function save(Request $request): JsonResponse
    {
        $request->validate([
            'db' => 'required|array',
            'db.driver' => 'required|in:sqlite,mysql,pgsql',
            'openai' => 'required|array',
            'openai.api_key' => 'required|string',
            'openai.model' => 'required|string',
            'telegram' => 'required|array',
            'telegram.bot_token' => 'required|string',
            'telegram.chat_id' => 'required|string',
        ]);

        try {
            $db = $request->input('db');
            $openai = $request->input('openai');
            $telegram = $request->input('telegram');

            $envData = [];

            // Database configuration
            $envData['DB_CONNECTION'] = $db['driver'];

            if ($db['driver'] === 'sqlite') {
                $envData['DB_DATABASE'] = database_path($db['database']);
            } else {
                $envData['DB_HOST'] = $db['host'];
                $envData['DB_PORT'] = $db['port'];
                $envData['DB_DATABASE'] = $db['database'];
                $envData['DB_USERNAME'] = $db['username'];
                $envData['DB_PASSWORD'] = $db['password'] ?? '';
            }

            // OpenAI configuration
            $envData['OPENAI_API_KEY'] = $openai['api_key'];
            $envData['OPENAI_MODEL'] = $openai['model'];

            // Telegram configuration
            $envData['TELEGRAM_BOT_TOKEN'] = $telegram['bot_token'];
            $envData['TELEGRAM_DEFAULT_CHAT_ID'] = $telegram['chat_id'];

            // Mark as installed
            $envData['APP_INSTALLED'] = 'true';

            // Update .env file
            if (!EnvHelper::updateEnv($envData)) {
                return $this->corsResponse([
                    'ok' => false,
                    'message' => 'Failed to update .env file',
                ], 500);
            }

            // Run migrations
            try {
                Artisan::call('migrate', ['--force' => true]);
                $migrationOutput = Artisan::output();
            } catch (\Exception $e) {
                Log::warning('Migration during setup failed', ['error' => $e->getMessage()]);
                $migrationOutput = 'Migration warning: ' . $e->getMessage();
            }

            return $this->corsResponse([
                'ok' => true,
                'message' => 'Setup completed successfully! Database built and ready.',
                'migration_output' => $migrationOutput,
            ]);

        } catch (\Exception $e) {
            Log::error('Setup save failed', ['error' => $e->getMessage()]);

            return $this->corsResponse([
                'ok' => false,
                'message' => 'Failed to save configuration: ' . $e->getMessage(),
            ], 500);
        }
    }
}
