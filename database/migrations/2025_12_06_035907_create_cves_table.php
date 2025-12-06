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
        Schema::create('cves', function (Blueprint $table) {
            $table->id();
            $table->string('cve_id')->unique();
            $table->string('source')->default('nvd');
            
            // Raw data
            $table->json('raw_data')->nullable();
            
            // Basic fields
            $table->timestamp('published_at')->nullable();
            $table->timestamp('last_modified_at')->nullable();
            $table->decimal('cvss_score', 4, 1)->nullable();
            $table->string('cvss_vector')->nullable();
            
            // AI analysis
            $table->text('summary')->nullable();
            $table->string('type')->nullable();
            $table->string('severity')->nullable();
            $table->string('exploit_likelihood')->nullable();
            $table->json('affected_products')->nullable();
            $table->json('recommended_actions')->nullable();
            
            // Status flags
            $table->string('analysis_status')->default('pending');
            
            $table->timestamps();
            
            $table->index('cve_id');
            $table->index('severity');
            $table->index('analysis_status');
            $table->index('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cves');
    }
};
