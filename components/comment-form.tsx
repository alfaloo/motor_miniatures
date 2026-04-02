"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CommentFormProps {
  itemId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({ itemId, onSuccess, onCancel }: CommentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const result = await createComment(itemId, { title, description });
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setTitle("");
        setDescription("");
        toast.success("Comment added");
        onSuccess?.();
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="comment-title" className="text-foreground">
          Title
        </Label>
        <Input
          id="comment-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={64}
          placeholder="Comment title"
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment-description" className="text-foreground">
          Description
        </Label>
        <Textarea
          id="comment-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your comment..."
          rows={3}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-blue-500 resize-none"
          required
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Comment
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-border bg-secondary hover:bg-accent text-foreground"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
