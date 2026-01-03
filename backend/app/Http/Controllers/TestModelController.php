<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTestModelRequest;
use App\Http\Requests\UpdateTestModelRequest;
use App\Http\Resources\TestModelCollection;
use App\Http\Resources\TestModelResource;
use App\Models\TestModel;
use App\Services\TestModelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestModelController extends Controller
{
    public function __construct(
        protected TestModelService $testModelService
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->filled('status') ? $request->string('status')->toString() : null,
            'search' => $request->filled('search') ? $request->string('search')->toString() : null,
        ];

        $testModels = $this->testModelService->getAllTestModels($filters);

        return new TestModelCollection($testModels);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestModelRequest $request): JsonResponse
    {
        $testModel = $this->testModelService->createTestModel($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Test model created successfully',
            'data' => new TestModelResource($testModel),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TestModel $testModel): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new TestModelResource($testModel),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestModelRequest $request, TestModel $testModel): JsonResponse
    {
        $testModel = $this->testModelService->updateTestModel(
            $testModel,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Test model updated successfully',
            'data' => new TestModelResource($testModel),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TestModel $testModel): JsonResponse
    {
        $this->testModelService->deleteTestModel($testModel);

        return response()->json([
            'success' => true,
            'message' => 'Test model deleted successfully',
        ]);
    }
}
