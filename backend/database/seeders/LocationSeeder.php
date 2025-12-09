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
        // Seed Cities
        $cities = [
            [
                'name' => 'Abuja',
                'slug' => 'abuja',
                'description' => 'Abuja is the capital city of Nigeria, located in the Federal Capital Territory.',
                'sort_order' => 1,
            ],
            [
                'name' => 'Lagos',
                'slug' => 'lagos',
                'description' => 'Lagos is the largest city in Nigeria and the economic hub of West Africa.',
                'sort_order' => 2,
            ],
            [
                'name' => 'Port Harcourt',
                'slug' => 'port-harcourt',
                'description' => 'Port Harcourt is a major port city in Rivers State, known as the oil capital of Nigeria.',
                'sort_order' => 3,
            ],
            [
                'name' => 'Enugu',
                'slug' => 'enugu',
                'description' => 'Enugu is the capital of Enugu State, known as the coal city of Nigeria.',
                'sort_order' => 4,
            ],
            [
                'name' => 'Asaba',
                'slug' => 'asaba',
                'description' => 'Asaba is the capital of Delta State, located on the western bank of the Niger River.',
                'sort_order' => 5,
            ],
            [
                'name' => 'Ibadan',
                'slug' => 'ibadan',
                'description' => 'Ibadan is the capital of Oyo State and the largest city in West Africa by area.',
                'sort_order' => 6,
            ],
            [
                'name' => 'Kano',
                'slug' => 'kano',
                'description' => 'Kano is the capital of Kano State and the largest city in Northern Nigeria.',
                'sort_order' => 7,
            ],
            [
                'name' => 'Benin City',
                'slug' => 'benin-city',
                'description' => 'Benin City is the capital of Edo State and a historic city in Nigeria.',
                'sort_order' => 8,
            ],
            [
                'name' => 'Kaduna',
                'slug' => 'kaduna',
                'description' => 'Kaduna is the capital of Kaduna State and a major commercial center in Northern Nigeria.',
                'sort_order' => 9,
            ],
            [
                'name' => 'Aba',
                'slug' => 'aba',
                'description' => 'Aba is a major commercial city in Abia State, known for its manufacturing and trade.',
                'sort_order' => 10,
            ],
        ];

        $seededCities = [];
        foreach ($cities as $cityData) {
            $city = Location::updateOrCreate(
                ['slug' => $cityData['slug']],
                [
                    'name' => $cityData['name'],
                    'type' => 'city',
                    'description' => $cityData['description'],
                    'is_active' => true,
                    'sort_order' => $cityData['sort_order'],
                ]
            );
            $seededCities[$cityData['slug']] = $city;
        }

        // Seed Areas for each city
        // Popular cities (top 5) have at least 15 areas each
        $areasByCity = [
            'abuja' => [
                'Wuse', 'Maitama', 'Asokoro', 'Garki', 'Utako', 'Gwarinpa', 'Lugbe', 'Kubwa', 'Nyanya', 'Karu',
                'Jabi', 'Jahi', 'Kado', 'Life Camp', 'Lokogoma', 'Gudu', 'Apo', 'Dutse', 'Bwari', 'Kuje'
            ],
            'lagos' => [
                'Victoria Island', 'Lekki', 'Ikeja', 'Surulere', 'Yaba', 'Ikoyi', 'Oshodi', 'Mushin', 'Alimosho', 'Agege',
                'Apapa', 'Maryland', 'Magodo', 'Ogba', 'Ilupeju', 'Palmgrove', 'Gbagada', 'Anthony', 'Onipanu', 'Bariga'
            ],
            'port-harcourt' => [
                'Port Harcourt Township', 'Rumuomasi', 'Rumuokoro', 'Rumuodomaya', 'Woji', 'Trans-Amadi', 'GRA Phase 1', 'GRA Phase 2', 'Rumuibekwe', 'Rumuola',
                'Rumuokwuta', 'Rumuigbo', 'Rumuapara', 'Rumueme', 'Rumuokwurusi', 'Rumuogba', 'Rumuokwachi', 'Rumuodara', 'Rumuokwuta', 'Rumuokwuta'
            ],
            'enugu' => [
                'Abakpa', 'Achara Layout', 'Emene', 'GRA', 'Independence Layout', 'New Haven', 'Ogui', 'Uwani', 'Thinkers Corner', 'Amechi',
                'Agbani Road', 'Coal Camp', 'Ogbete', 'Udi Road', 'Zik Avenue', 'Chime Avenue', 'Okpara Avenue', 'Obiagu', 'Asata', 'Idaw River'
            ],
            'asaba' => [
                'Asaba GRA', 'Okwe', 'Okpanam Road', 'Nnebisi Road', 'Cable Point', 'Summit Road', 'DBS Road', 'Anwai Road', 'Okpili', 'Nkpologwu',
                'Okpanam', 'Ibusa', 'Oshimili North', 'Oshimili South', 'Anwai', 'Okwe', 'Cable Point', 'Summit', 'DBS', 'Nnebisi'
            ],
            'ibadan' => [
                'Bodija', 'Agodi', 'Mokola', 'Sango', 'Dugbe', 'Apata', 'Ojoo', 'Agbowo', 'Iwo Road', 'Akobo'
            ],
            'kano' => [
                'Fagge', 'Nassarawa', 'Tudun Wada', 'Sabon Gari', 'Bompai', 'Sharada', 'Gyadi-Gyadi', 'Rijiyar Zaki', 'Kwankwaso', 'Ungogo'
            ],
            'benin-city' => [
                'GRA', 'Oba Market', 'Ring Road', 'Ugbowo', 'Ikpoba Hill', 'Aduwawa', 'Uselu', 'Sapele Road', 'Airport Road', 'Ekehuan'
            ],
            'kaduna' => [
                'Kaduna North', 'Kaduna South', 'Barnawa', 'Narayi', 'Sabon Tasha', 'Ungwan Rimi', 'Kawo', 'Malali', 'Tudun Wada', 'Trikania'
            ],
            'aba' => [
                'Ariaria', 'Asa Road', 'Ehere', 'Faulks Road', 'Ngwa Road', 'Obohia Road', 'Port Harcourt Road', 'St. Michaels Road', 'Ehi Road', 'Abayi'
            ],
        ];

        foreach ($areasByCity as $citySlug => $areas) {
            if (!isset($seededCities[$citySlug])) {
                continue;
            }

            $city = $seededCities[$citySlug];
            
            foreach ($areas as $index => $areaName) {
                Location::updateOrCreate(
                    [
                        'name' => $areaName,
                        'type' => 'area',
                        'parent_id' => $city->id
                    ],
                    [
                        'slug' => \Illuminate\Support\Str::slug($city->name . '-' . $areaName),
                        'description' => "Popular area in {$city->name}",
                        'is_active' => true,
                        'is_popular' => true,
                        'sort_order' => $index + 1,
                    ]
                );
            }
        }

        $this->command->info('Locations seeded successfully!');
    }
}
