import CurateHeader from '@/components/Home/CurateHeader';

export default function Home() {
  return (
    <main className="relative min-h-[200vh] bg-white">
      <CurateHeader />
      
      {/* Content will go here */}
      <section className="pt-40 px-6 max-w-7xl mx-auto">
        <div className="h-[400px] w-full bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 italic text-slate-400">
           Dynamic Curate Experience Content
        </div>
      </section>
    </main>
  );
}
