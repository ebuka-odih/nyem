<?php

namespace App\Http\Requests;

use App\Models\Listing;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreListingRequest extends FormRequest
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
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'condition' => ['required', Rule::in(Listing::getConditionOptions())],
            'photos' => 'required|array|min:2',
            'photos.*' => 'string|max:2048',
            'type' => ['nullable', Rule::in(Listing::getTypeOptions())],
            'price' => 'nullable|numeric|min:0|required_if:type,marketplace',
            'looking_for' => 'nullable|string|max:255|required_if:type,barter',
            'city' => 'nullable|string|max:255',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'The title field is required.',
            'category_id.required' => 'Please select a category.',
            'category_id.exists' => 'The selected category is invalid.',
            'condition.required' => 'Please select a condition.',
            'condition.in' => 'The selected condition is invalid.',
            'photos.required' => 'At least 2 photos are required.',
            'photos.min' => 'You must upload at least 2 photos.',
            'price.required_if' => 'Price is required for marketplace listings.',
            'looking_for.required_if' => 'Looking for is required for barter listings.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Default to 'barter' if type is not provided
        if (!$this->has('type')) {
            $this->merge(['type' => Listing::TYPE_BARTER]);
        }
    }
}


