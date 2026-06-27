'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface InviteButtonProps {
    walletAddress: string;
}

export default function InviteButton({ walletAddress }: InviteButtonProps) {
    const [copied, setCopied] = useState(false);

    const inviteUrl = `https://metis-app.vercel.app/invite/${walletAddress}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            title={inviteUrl}
            className="font-mono text-xs border border-hairline px-3 py-2 rounded-full flex items-center gap-2 hover:border-accent hover:text-accent transition-colors text-muted bg-transparent cursor-pointer"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-approve shrink-0" />
                    <span className="text-approve">Copied!</span>
                </>
            ) : (
                <>
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Share invite</span>
                    <Copy className="w-3 h-3 shrink-0 opacity-50" />
                </>
            )}
        </button>
    );
}
