<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            'Abuja',
            'Lagos',
            'Port Harcourt',
            'Enugu',
            'Asaba',
        ];

        foreach ($locations as $index => $name) {
            Location::firstOrCreate(
                ['name' => $name],
                ['order' => $index + 1]
            );
        }
    }
}
