import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { items, comments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CommentCard } from "@/components/comment-card";
import { Pagination } from "@/components/pagination";
import { AddCommentToggle } from "@/components/add-comment-toggle";
import { ToastOnMount } from "@/components/toast-on-mount";
import { ChevronRight, Pencil } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COMMENT_PAGE_SIZE = 10;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <dt className="text-sm text-slate-400 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-white">{value}</dd>
    </div>
  );
}

export default async function ViewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const sp = await searchParams;

  const item = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.user_id, session.user.id)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!item) {
    notFound();
  }

  const commentPage = Math.max(1, parseInt(sp.commentPage ?? "1", 10) || 1);

  const allComments = await db
    .select()
    .from(comments)
    .where(eq(comments.item_id, id))
    .orderBy(desc(comments.created_at));

  const totalComments = allComments.length;
  const totalCommentPages = Math.ceil(totalComments / COMMENT_PAGE_SIZE);
  const currentCommentPage = Math.min(commentPage, Math.max(1, totalCommentPages));
  const start = (currentCommentPage - 1) * COMMENT_PAGE_SIZE;
  const pageComments = allComments.slice(start, start + COMMENT_PAGE_SIZE);

  const showPreorder = item.is_preorder && item.received_year === null;

  return (
    <div className="space-y-6">
      <ToastOnMount toastKey={sp.toast} />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">
          Collection
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-300">
          {item.brand} {item.model}
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">View</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {item.brand} {item.model}
          </h1>
          <p className="text-slate-400 mt-1">{item.variant}</p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <Link href={`/items/${item.id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Item details */}
        <div className="space-y-4">
          {/* Identity */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-3">
                Identity
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {item.scale}
                  </Badge>
                  {item.grade !== null ? (
                    <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
                      Grade {item.grade}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                      Ungraded
                    </Badge>
                  )}
                  {showPreorder && (
                    <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
                      Preorder
                    </Badge>
                  )}
                  {item.is_sold && (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">
                      Sold
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-slate-700/50">
                <DetailRow label="Brand" value={item.brand} />
                <DetailRow label="Make" value={item.make} />
                <DetailRow label="Model" value={item.model} />
                <DetailRow label="Variant" value={item.variant} />
                <DetailRow label="Scale" value={item.scale} />
                {item.serial_number !== null && (
                  <DetailRow label="Serial Number" value={item.serial_number} />
                )}
                {item.production_count !== null && (
                  <DetailRow label="Production Count" value={item.production_count.toLocaleString()} />
                )}
                <DetailRow
                  label="Grade"
                  value={item.grade !== null ? `${item.grade} / 10` : "Ungraded"}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Purchase */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-slate-700/50">
                <DetailRow label="Price" value={`$${item.purchase_price.toLocaleString()}`} />
                <DetailRow label="Platform" value={item.purchase_platform} />
                <DetailRow
                  label="Date"
                  value={`${MONTHS[item.purchase_month - 1]} ${item.purchase_year}`}
                />
                <DetailRow
                  label="Preorder"
                  value={item.is_preorder ? "Yes" : "No"}
                />
                {item.is_preorder && (
                  <DetailRow
                    label="Received"
                    value={
                      item.received_year && item.received_month
                        ? `${MONTHS[item.received_month - 1]} ${item.received_year}`
                        : "Pending"
                    }
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Sale (only if relevant) */}
          {item.is_sold && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-slate-700/50">
                  <DetailRow
                    label="Sold Price"
                    value={item.sold_price ? `$${item.sold_price.toLocaleString()}` : "—"}
                  />
                  <DetailRow label="Platform" value={item.sold_platform ?? "—"} />
                  <DetailRow
                    label="Date"
                    value={
                      item.sold_year && item.sold_month
                        ? `${MONTHS[item.sold_month - 1]} ${item.sold_year}`
                        : "—"
                    }
                  />
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Comments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">
              Comments{" "}
              <span className="text-slate-400 font-normal text-sm">
                ({totalComments})
              </span>
            </h2>
          </div>

          <AddCommentToggle itemId={item.id} />

          <Separator className="bg-slate-700" />

          {/* Comment list */}
          {pageComments.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {pageComments.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))}
            </div>
          )}

          {totalCommentPages > 1 && (
            <Pagination
              currentPage={currentCommentPage}
              totalPages={totalCommentPages}
              searchParams={sp}
              pageParamName="commentPage"
            />
          )}
        </div>
      </div>
    </div>
  );
}
