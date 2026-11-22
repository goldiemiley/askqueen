import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  sabrina: string;
  children: ReactNode;
};

/**
 * Honest holding page for routes whose feature lands in a later milestone.
 * It doesn't show any controls that pretend to work.
 */
export function OpeningSoon({ title, sabrina, children }: Props) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
      <h1 className="text-h1 text-burgundy sm:text-[3.75rem]">{title}</h1>
      <blockquote className="mt-8 border-l-2 border-gold pl-5">
        <p className="font-display text-h3 leading-snug text-plum">&ldquo;{sabrina}&rdquo;</p>
        <footer className="mt-2 text-plum/70">Sabrina</footer>
      </blockquote>
      <div className="mt-8 max-w-[62ch] space-y-4 text-plum/85">{children}</div>
      <p className="mt-6 rounded-2xl bg-blush-soft px-5 py-4 text-plum">
        This reading opens in the next AskQueen build. Nothing on this page collects your details.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Back to the homepage
        </Link>
      </div>
    </section>
  );
}
