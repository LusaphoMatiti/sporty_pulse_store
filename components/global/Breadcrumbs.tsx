import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-neutral-900 hover:underline dark:hover:text-neutral-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={
                    isLast
                      ? "font-medium text-neutral-900 dark:text-neutral-100"
                      : ""
                  }
                >
                  {item.label}
                </span>
              )}
              {!isLast && <LuChevronRight className="h-3.5 w-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
