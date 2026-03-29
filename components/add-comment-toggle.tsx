"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/components/comment-form";
import { Plus } from "lucide-react";

interface AddCommentToggleProps {
  itemId: string;
}

export function AddCommentToggle({ itemId }: AddCommentToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Comment
        </Button>
      )}
      {isOpen && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">New Comment</h4>
          <CommentForm
            itemId={itemId}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
