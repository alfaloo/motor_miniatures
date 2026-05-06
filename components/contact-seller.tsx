'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactSellerProps {
  username: string;
  phoneNumber: string | null;
  emailAddress: string | null;
  socialLinks: { name: string; url: string }[];
}

export function ContactSeller({
  username,
  phoneNumber,
  emailAddress,
  socialLinks,
}: ContactSellerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground">Contact Seller</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-5 space-y-3 border-t border-border pt-4">
          {/* Vendor username — always shown */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Vendor</span>
            <span className="font-bold text-foreground">{username}</span>
          </div>

          {/* Phone — only if non-null */}
          {phoneNumber && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Phone</span>
              <span className="text-foreground">{phoneNumber}</span>
            </div>
          )}

          {/* Email — only if non-null */}
          {emailAddress && (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Email</span>
              <span className="text-foreground">{emailAddress}</span>
            </div>
          )}

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.map((link) => (
                <Button
                  key={link.url}
                  variant="outline"
                  size="sm"
                  className="min-w-[120px] flex-1 border-border"
                  onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {link.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
