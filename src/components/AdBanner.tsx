import React, { useEffect } from 'react';

export default function AdBanner({ slotId, format = "auto" }: { slotId?: string, format?: string }) {
    useEffect(() => {
        try {
            // Find the window object for AdSense
            const adConfig = (window as any).adsbygoogle || [];
            // Only push if not already pushed to this particular instance
            adConfig.push({});
        } catch (e) {
            console.error('AdSense initialization error:', e);
        }
    }, []);

    return (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden my-6 flex flex-col items-center justify-center p-4 relative min-h-[120px] shadow-xl group">
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-white/5 z-10">
                Advertisement
            </div>

            {/* Real Google AdSense Slot */}
            {/* Remove the className opacity-0 if you actually put your publisher ID in */}
            <div className="w-full relative z-0 flex justify-center">
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', minHeight: '90px' }}
                    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" /* Replace with your actual Publisher ID! */
                    data-ad-slot={slotId || "1234567890"}     /* Replace with your actual Slot ID! */
                    data-ad-format={format}
                    data-full-width-responsive="true"
                />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm group-hover:bg-zinc-900/50 transition-colors z-20 pointer-events-none">
                <p className="text-zinc-500 font-bold mb-1">AdSense Placeholder</p>
                <p className="text-xs text-zinc-600">Edit src/components/AdBanner.tsx to add your Publisher ID</p>
            </div>
        </div>
    );
}
