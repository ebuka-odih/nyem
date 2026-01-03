<?php

namespace App\Services;

use App\Models\TestModel;
use Illuminate\Database\Eloquent\Collection;

class TestModelService
{
    /**
     * Create a new test model
     */
    public function createTestModel(array $data): TestModel
    {
        return TestModel::create($data);
    }

    /**
     * Update an existing test model
     */
    public function updateTestModel(TestModel $testModel, array $data): TestModel
    {
        $testModel->update($data);
        $testModel->refresh();

        return $testModel;
    }

    /**
     * Get all test models with optional filtering
     */
    public function getAllTestModels(array $filters = []): Collection
    {
        $query = TestModel::query();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
            });
        }

        return $query->latest()->get();
    }

    /**
     * Get a single test model by ID
     */
    public function getTestModelById(int $id): ?TestModel
    {
        return TestModel::find($id);
    }

    /**
     * Delete a test model
     */
    public function deleteTestModel(TestModel $testModel): bool
    {
        return $testModel->delete();
    }
}

