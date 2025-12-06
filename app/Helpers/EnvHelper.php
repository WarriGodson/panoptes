<?php

namespace App\Helpers;

class EnvHelper
{
    /**
     * Update or add environment variables in .env file
     * 
     * @param array $data Key-value pairs to update
     * @return bool
     */
    public static function updateEnv(array $data): bool
    {
        $envPath = base_path('.env');
        
        if (!file_exists($envPath)) {
            return false;
        }

        $envContent = file_get_contents($envPath);
        
        foreach ($data as $key => $value) {
            // Escape special characters in value
            $value = self::escapeEnvValue($value);
            
            // Check if key exists
            $pattern = "/^{$key}=.*/m";
            
            if (preg_match($pattern, $envContent)) {
                // Update existing key
                $envContent = preg_replace($pattern, "{$key}={$value}", $envContent);
            } else {
                // Add new key at the end
                $envContent .= "\n{$key}={$value}";
            }
        }

        return file_put_contents($envPath, $envContent) !== false;
    }

    /**
     * Escape environment value if needed
     * 
     * @param mixed $value
     * @return string
     */
    private static function escapeEnvValue($value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $value = (string) $value;

        // If value contains spaces or special characters, wrap in quotes
        if (preg_match('/\s/', $value) || str_contains($value, '#')) {
            $value = '"' . addslashes($value) . '"';
        }

        return $value;
    }

    /**
     * Get an environment variable value
     * 
     * @param string $key
     * @return string|null
     */
    public static function getEnv(string $key): ?string
    {
        $envPath = base_path('.env');
        
        if (!file_exists($envPath)) {
            return null;
        }

        $envContent = file_get_contents($envPath);
        $pattern = "/^{$key}=(.*)$/m";
        
        if (preg_match($pattern, $envContent, $matches)) {
            $value = trim($matches[1]);
            
            // Remove quotes if present
            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }
            
            return $value;
        }

        return null;
    }
}
