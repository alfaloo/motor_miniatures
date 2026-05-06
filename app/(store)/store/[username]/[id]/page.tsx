import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingDetail } from "@/lib/actions/marketplace";
import { formatPrice } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <dt className="text-sm text-muted-foreground sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export default async function PublicListingDetailPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;

  const [userRow] = await db
    .select({ id: users.id, currency: users.currency })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!userRow) {
    notFound();
  }

  const listing = await getListingDetail(id);

  if (!listing || listing.user_id !== userRow.id) {
    notFound();
  }

  const currency = userRow.currency ?? "USD";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={`/store/${username}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {username}&apos;s store
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {listing.brand} {listing.make} {listing.model} {listing.variant}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-xs">
            {listing.scale}
          </Badge>
          {listing.is_preorder && (
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
              Pre-order
            </Badge>
          )}
        </div>
      </div>

      {/* Attributes table */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4">
          <dl className="divide-y divide-border">
            <DetailRow label="Scale" value={listing.scale} />
            {listing.production_count !== null && (
              <DetailRow
                label="Production Count"
                value={listing.production_count.toLocaleString()}
              />
            )}
            <DetailRow
              label="Status"
              value={listing.is_preorder ? "Pre-order" : "Ready Stock"}
            />
          </dl>
        </CardContent>
      </Card>

      {/* Description block */}
      {listing.description && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Price breakdown card */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3">
        <h2 className="text-base font-semibold text-foreground">Price Breakdown</h2>

        {/* Base price */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base price</span>
          <span className="text-foreground">{formatPrice(listing.base_price, currency)}</span>
        </div>

        {/* Add-on groups */}
        {listing.addon_groups.map((group) => (
          <div key={group.category_id} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2">
              {group.category_name}
            </p>
            {group.options.map((option) => (
              <div key={option.id} className="flex justify-between text-sm pl-2">
                <span className="text-foreground">{option.name}</span>
                <span className="text-foreground">{formatPrice(option.price, currency)}</span>
              </div>
            ))}
          </div>
        ))}

        <Separator className="bg-border" />

        {/* Total */}
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatPrice(listing.total_price, currency)}</span>
        </div>
      </div>
    </div>
  );
}
