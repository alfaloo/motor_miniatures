"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateComment, deleteComment } from "@/lib/actions/comments";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface CommentCardProps {
  comment: {
    id: string;
    title: string;
    description: string;
    created_at: Date;
    item_id: string;
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function CommentCard({ comment }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(comment.title);
  const [editDescription, setEditDescription] = useState(comment.description);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    setIsSaving(true);
    try {
      const result = await updateComment(comment.id, {
        title: editTitle,
        description: editDescription,
      });
      if (result?.error) {
        setEditError(result.error);
        toast.error(result.error);
      } else {
        setIsEditing(false);
        toast.success("Comment updated");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditTitle(comment.title);
    setEditDescription(comment.description);
    setEditError(null);
    setIsEditing(false);
  }

  async function handleDelete() {
    setIsDeleting(true);
    await deleteComment(comment.id, comment.item_id);
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-blue-500 bg-slate-800 p-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Title</Label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={64}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Description</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 resize-none"
              required
            />
          </div>
          {editError && <p className="text-sm text-red-400">{editError}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSaving}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-white leading-tight">{comment.title}</h4>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete comment?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to delete this comment? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-slate-700 bg-slate-700 hover:bg-slate-600 text-slate-200">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.description}</p>
      <p className="text-xs text-slate-500">{formatDate(comment.created_at)}</p>
    </div>
  );
}
