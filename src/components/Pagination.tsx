import Link from "next/link";
export function Pagination({ page, total, size = 25, base, params = {}, pageKey = "page" }: { page: number; total: number; size?: number; base: string; params?: Record<string, string | undefined>; pageKey?: string }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => { const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined)); query.set(pageKey, String(p)); return base + "?" + query; };
  return <nav aria-label="Pagination" className="flex items-center justify-between gap-3 py-4 text-sm text-neutral-300">
    {page > 1 ? <Link href={href(page - 1)}>? Previous</Link> : <span />}
    <span>Page {page} of {pages} ? {total} results</span>
    {page < pages ? <Link href={href(page + 1)}>Next ?</Link> : <span />}
  </nav>;
}