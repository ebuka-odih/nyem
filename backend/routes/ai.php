<?php

use Laravel\Mcp\Facades\Mcp;

// Mcp::web('/mcp/demo', \App\Mcp\Servers\PublicServer::class);

use App\Mcp\Servers\WeatherServer;



Mcp::web('/mcp/weather', WeatherServer::class);
Mcp::local('weather', WeatherServer::class);
