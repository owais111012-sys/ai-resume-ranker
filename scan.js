// Backend AI Scanner Engine with Train Marquee & Zoom Animation
        async function handleScanDirect(inputVal) {
            const resultBox = document.getElementById('resultBox');

            // Render train marquee loading state
            resultBox.classList.remove('hidden');
            resultBox.innerHTML = `
                <div class="py-6 overflow-hidden relative bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-brand-500/30 shadow-inner flex flex-col items-center justify-center">
                    <div class="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>
                    <div class="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-100 dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>
                    
                    <div class="flex items-center space-x-2 mb-3">
                        <div class="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
                        <span class="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">CyberShield AI Neural Grid</span>
                    </div>

                    <!-- Train Track Marquee -->
                    <div class="w-full overflow-hidden whitespace-nowrap py-2 relative flex items-center">
                        <div id="trainTrack" class="flex space-x-12 animate-marquee items-center font-mono text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
                            <span class="train-item transition-all duration-300 transform scale-90 opacity-60">🔍 Analyzing Domain Metadata...</span>
                            <span class="train-item transition-all duration-300 transform scale-125 opacity-100 text-brand-600 dark:text-brand-400 font-bold drop-shadow-md">🕵️‍♂️ Inspecting Typosquatting & Brand Clones...</span>
                            <span class="train-item transition-all duration-300 transform scale-90 opacity-60">🛡️ Scanning Phishing Scam Vectors...</span>
                            <span class="train-item transition-all duration-300 transform scale-90 opacity-60">🤖 Executing Groq AI Intelligence Verdict...</span>
                            <!-- Repeated for infinite smooth train flow -->
                            <span class="train-item transition-all duration-300 transform scale-90 opacity-60">🔍 Analyzing Domain Metadata...</span>
                            <span class="train-item transition-all duration-300 transform scale-125 opacity-100 text-brand-600 dark:text-brand-400 font-bold drop-shadow-md">🕵️‍♂️ Inspecting Typosquatting & Brand Clones...</span>
                        </div>
                    </div>
                </div>
            `;

            // Inject CSS style dynamically for the train marquee movement if not already present
            if (!document.getElementById('marqueeStyle')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'marqueeStyle';
                styleEl.innerHTML = `
                    @keyframes trainMove {
                        0% { transform: translateX(0%); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        display: flex;
                        width: max-content;
                        animation: trainMove 8s linear infinite;
                    }
                `;
                document.head.appendChild(styleEl);
            }

            try {
                const response = await fetch('/.netlify/functions/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: inputVal })
                });

                if (!response.ok) {
                    throw new Error("Serverless backend function not reachable.");
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                const aiReply = data.choices[0].message.content;
                const replyUpper = aiReply.toUpperCase();

                let status = 'safe';
                if (replyUpper.includes("DANGER") || replyUpper.includes("HIGH RISK")) {
                    status = 'danger';
                } else if (replyUpper.includes("CAUTION") || replyUpper.includes("SUSPICIOUS")) {
                    status = 'caution';
                }

                renderResult(status, aiReply, inputVal);

            } catch (error) {
                // Fallback simulation for local testing
                let fallbackStatus = 'safe';
                let fallbackText = "SAFE: No major threat patterns detected by client evaluation.";
                const lower = inputVal.toLowerCase();

                if (lower.includes('..') || lower.includes('fipkart') || lower.includes('paytm-login')) {
                    fallbackStatus = 'danger';
                    fallbackText = "DANGER: High risk of phishing/typosquatting detected!";
                } else if (lower.includes('.xyz') || lower.includes('.top')) {
                    fallbackStatus = 'caution';
                    fallbackText = "CAUTION: Suspicious domain extension or parameters found.";
                }

                renderResult(fallbackStatus, fallbackText + " (Note: Local environment fallback active)", inputVal);
            }
        }