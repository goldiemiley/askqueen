import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <h1 className="text-h1 text-burgundy sm:text-[3.75rem]">This page isn&rsquo;t in the stars</h1>
      <p className="mt-6 max-w-[56ch] text-lede text-plum/85">
        Sabrina looked everywhere, including under the tarot deck. The link may be old or mistyped.
      </p>
      <Link href="/" className="btn btn-primary mt-10">
        Back to the homepage
      </Link>
    </section>
  );
}
