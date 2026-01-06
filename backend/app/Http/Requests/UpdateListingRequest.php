<?php

namespace App\Http\Requests;

use App\Models\Listing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'condition' => ['sometimes', Rule::in(Listing::getConditionOptions())],
            'photos' => 'sometimes|array|min:1',
            'photos.*' => 'string|max:2048',
            'type' => ['sometimes', Rule::in(Listing::getTypeOptions())],
            'price' => 'sometimes|nullable|numeric|min:0',
            'looking_for' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|string|max:255',
            'status' => ['sometimes', Rule::in(Listing::getStatusOptions())],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'category_id.exists' => 'The selected category is invalid.',
            'condition.in' => 'The selected condition is invalid.',
            'status.in' => 'The selected status is invalid.',
        ];
    }
}





