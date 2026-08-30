import Shell from "@/components/Shell";
import Hero from "@/components/Hero";
import BookCard from "@/components/BookCard";
import SectionHeader from "@/components/SectionHeader";
import Categories from "@/components/Categories";
import { onSale, books } from "@/lib/data";

export default function Home() {
  const newArrivals = [...books].reverse().slice(0, 4);

  return (
    <Shell>
      <main className="flex flex-1 flex-col gap-10 px-4 pb-12 sm:px-6 lg:px-9">
        <Hero />

        <section className="flex flex-col gap-5">
          <SectionHeader title="Browse categories" subtitle="Find your next favourite genre" />
          <Categories />
        </section>

        <section className="flex flex-col gap-5">
          <SectionHeader title="Books on sale" subtitle="Limited-time offers, picked for you" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {onSale.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 pb-4">
          <SectionHeader title="New arrivals" subtitle="Fresh off the press this week" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      </main>
    </Shell>
  );
}
