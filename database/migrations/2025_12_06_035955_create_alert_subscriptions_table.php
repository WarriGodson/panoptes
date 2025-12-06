<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alert_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id');
            $table->string('chat_type')->default('telegram');
            $table->json('keywords')->nullable();
            $table->string('min_severity')->default('High');
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            
            $table->index(['chat_id', 'chat_type']);
            $table->index('enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alert_subscriptions');
    }
};
