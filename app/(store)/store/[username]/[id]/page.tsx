import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, userSocialLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getListingDetail } from "@/lib/actions/marketplace";
import { formatPrice } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ContactSeller } from "@/components/contact-seller";
import { ChevronRight } from "lucide-react";

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

  const [userRow, listing] = await Promise.all([
    db
      .select({
        id: users.id,
        currency: users.currency,
        phoneNumber: users.phone_number,
        emailAddress: users.email_address,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .then((rows) => rows[0]),
    getListingDetail(id),
  ]);

  if (!userRow) {
    notFound();
  }

  if (!listing || listing.user_id !== userRow.id) {
    notFound();
  }

  const socialLinks = await db
    .select({ name: userSocialLinks.name, url: userSocialLinks.url })
    .from(userSocialLinks)
    .where(eq(userSocialLinks.user_id, userRow.id))
    .orderBy(userSocialLinks.sort_order);

  const currency = userRow.currency ?? "USD";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href={`/store/${username}`} className="hover:text-foreground transition-colors">
          {username}&apos;s Customs
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">
          {listing.brand} {listing.model}
        </span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">View</span>
      </nav>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {listing.brand} {listing.model}
        </h1>
        {listing.variant && (
          <p className="text-sm text-muted-foreground">{listing.variant}</p>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Panel 1 — Details */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-3">
                Details
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                    {listing.scale}
                  </Badge>
                  {listing.is_made_to_order && (
                    <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs">
                      Made to Order
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <DetailRow label="Brand" value={listing.brand} />
                <DetailRow label="Make" value={listing.make} />
                <DetailRow label="Model" value={listing.model} />
                <DetailRow label="Variant" value={listing.variant} />
                <DetailRow label="Scale" value={listing.scale} />
                <DetailRow
                  label="Production Count"
                  value={
                    listing.production_count !== null
                      ? listing.production_count.toLocaleString()
                      : "—"
                  }
                />
                <DetailRow
                  label="Status"
                  value={listing.is_made_to_order ? "Made to Order" : "Ready Stock"}
                />
                {listing.is_made_to_order && listing.preorder_wait_days != null && (
                  <DetailRow
                    label="Expected Wait"
                    value={`${listing.preorder_wait_days} days`}
                  />
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Panel 2 — Notes / Description */}
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

          {/* Panel 3 — Price Breakdown */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">Price Breakdown</h2>

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

            <div className="flex justify-between text-sm font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">{formatPrice(listing.total_price, currency)}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Display image */}
          <div className="w-full aspect-square overflow-hidden rounded-xl border border-border">
            <img
              src={listing.display_image_url ?? "/listing-placeholder.svg"}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Contact Seller */}
          <ContactSeller
            username={username}
            phoneNumber={userRow.phoneNumber ?? null}
            emailAddress={userRow.emailAddress ?? null}
            socialLinks={socialLinks}
          />
        </div>
      </div>
    </div>
  );
}
