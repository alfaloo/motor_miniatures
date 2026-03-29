import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string>;
  pageParamName?: string;
}

function buildUrl(
  page: number,
  searchParams: Record<string, string>,
  pageParamName: string
): string {
  const params = new URLSearchParams({ ...searchParams, [pageParamName]: String(page) });
  return `?${params.toString()}`;
}

export function Pagination({
  currentPage,
  totalPages,
  searchParams = {},
  pageParamName = "page",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const { [pageParamName]: _page, ...rest } = searchParams;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {currentPage > 1 ? (
        <Button asChild variant="outline" size="icon" className="border-slate-700 bg-slate-800 hover:bg-slate-700">
          <Link href={buildUrl(currentPage - 1, rest, pageParamName)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled className="border-slate-700 bg-slate-800 opacity-50">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <Button
            key={p}
            asChild={p !== currentPage}
            variant={p === currentPage ? "default" : "outline"}
            size="icon"
            className={
              p === currentPage
                ? "bg-blue-600 hover:bg-blue-700 border-blue-600"
                : "border-slate-700 bg-slate-800 hover:bg-slate-700"
            }
          >
            {p !== currentPage ? (
              <Link href={buildUrl(p, rest, pageParamName)}>{p}</Link>
            ) : (
              <span>{p}</span>
            )}
          </Button>
        )
      )}

      {currentPage < totalPages ? (
        <Button asChild variant="outline" size="icon" className="border-slate-700 bg-slate-800 hover:bg-slate-700">
          <Link href={buildUrl(currentPage + 1, rest, pageParamName)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled className="border-slate-700 bg-slate-800 opacity-50">
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
