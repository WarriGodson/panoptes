<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cve;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CveController extends Controller
{
    /**
     * List CVEs with optional filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Cve::where('analysis_status', 'complete');

        // Filter by severity
        if ($request->has('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Search by vendor (in affected_products)
        if ($request->has('vendor')) {
            $vendor = strtolower($request->input('vendor'));
            $query->where(function ($q) use ($vendor) {
                $q->whereRaw('LOWER(affected_products) LIKE ?', ["%{$vendor}%"]);
            });
        }

        // General search (cve_id or summary)
        if ($request->has('q')) {
            $search = $request->input('q');
            $query->where(function ($q) use ($search) {
                $q->where('cve_id', 'like', "%{$search}%")
                  ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        // Order by published date, latest first
        $query->orderBy('published_at', 'desc');

        // Paginate results
        $perPage = min((int) $request->input('per_page', 20), 100);
        $cves = $query->paginate($perPage);

        return response()->json($cves);
    }

    /**
     * Get detailed information about a specific CVE
     * 
     * @param string $cveId
     * @return JsonResponse
     */
    public function show(string $cveId): JsonResponse
    {
        // Normalize CVE ID to uppercase
        $cveId = strtoupper($cveId);

        $cve = Cve::where('cve_id', $cveId)->first();

        if (!$cve) {
            return response()->json([
                'error' => 'CVE not found',
                'cve_id' => $cveId,
            ], 404);
        }

        return response()->json($cve);
    }
}
