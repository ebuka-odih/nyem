<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nyem QR Code Generator</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Outfit', 'sans-serif'],
                    },
                    colors: {
                        brand: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            900: '#0c4a6e',
                        }
                    }
                }
            }
        }
    </script>

    <!-- QRCode.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>

    <style>
        body {
            background-color: #0f172a;
            background-image: 
                radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
                radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
                radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
        }
        .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body class="text-white min-h-screen flex items-center justify-center p-4">

    <div class="glass rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden group">
        <!-- Decoration -->
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">
                Nyem Access
            </h1>
            <p class="text-gray-400 text-sm">Scan to visit the welcome page</p>
        </div>
        
        <div class="flex flex-col items-center justify-center space-y-8">
            <!-- QR Code Container -->
            <div class="relative group-hover:scale-105 transition-transform duration-500">
                <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div class="relative bg-white p-4 rounded-xl">
                    <div id="qrcode"></div>
                </div>
            </div>

             <!-- URL Input -->
             <div class="w-full">
                <label for="urlInput" class="block text-xs font-medium text-gray-400 mb-1 ml-1">Target URL</label>
                <div class="relative rounded-md shadow-sm">
                    <input type="text" id="urlInput" 
                        class="block w-full rounded-lg border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 bg-white/90 backdrop-blur"
                        placeholder="https://nyem.online"
                        value="https://nyem.online">
                </div>
            </div>

            <!-- Download Button -->
            <button onclick="downloadQR()" class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
                <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg class="h-5 w-5 text-blue-300 group-hover:text-blue-100 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </span>
                Download QR Code
            </button>
        </div>

        <div class="mt-8 text-center">
            <p class="text-xs text-slate-500">
                Generated securely on the client side.
            </p>
        </div>
    </div>

    <script type="text/javascript">
        let qrcodeObj = null;
        const qrcodeContainer = document.getElementById("qrcode");
        const urlInput = document.getElementById("urlInput");

        function generateQR() {
            // Clear previous QR code
            qrcodeContainer.innerHTML = "";
            const url = urlInput.value || "https://nyem.online"; // Fallback

            qrcodeObj = new QRCode(qrcodeContainer, {
                text: url,
                width: 200,
                height: 200,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }

        // Initialize
        generateQR();

        // Update on input change
        let debounceTimer;
        urlInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(generateQR, 300);
        });

        // Download functionality
        function downloadQR() {
            const qrImage = qrcodeContainer.querySelector("img");
            
            if (qrImage && qrImage.src) {
                const link = document.createElement("a");
                link.href = qrImage.src;
                link.download = "nyem-access-qr.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Canvas fallback
                const canvas = qrcodeContainer.querySelector("canvas");
                if (canvas) {
                    const link = document.createElement("a");
                    link.href = canvas.toDataURL("image/png");
                    link.download = "nyem-access-qr.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        }
    </script>
</body>
</html>
