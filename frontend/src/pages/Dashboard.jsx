/*
export default function Dashboard() {
 
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-red-700 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-display text-red-500"> El nombre del proyecto =? APIArena </h1>

          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-red-600 border border-red-400 flex items-center justify-center text-sm text-white"> JG </div>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-slate-900 border border-red-600 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-display text-white"> Bienvenido de nuevo, Nombre de Usuario </h2>
          <p className="mt-2 text-slate-300"> Tu estas preparado. ¿Listo para dominar el ranking de APIArena? </p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Progreso de los Retos</span>
              <span className="text-red-400 font-mono">70%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden border border-red-500">
              <div className="h-full w-[70%] bg-red-500" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition">
            <p className="text-sm text-slate-400">Racha</p>
            <p className="text-3xl font-display text-red-400 mt-2">6 Dias</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition">
            <p className="text-sm text-slate-400">Retos Activos</p>
            <p className="text-3xl font-display text-red-400 mt-2">12</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition">
            <p className="text-sm text-slate-400">Resueltos</p>
            <p className="text-3xl font-display text-red-400 mt-2">38</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 hover:border-red-500 transition">
            <p className="text-sm text-slate-400">Porcentaje de Victoria</p>
            <p className="text-3xl font-display text-red-400 mt-2">74%</p>
          </div>

        </section>

        <section className="bg-slate-900 border border-red-600 rounded-2xl p-8 shadow-xl">
        
          <h3 className="text-2xl font-display mb-6 text-red-400">
            Desafíos Recientes
          </h3>

          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:border-red-500 transition">
              <div>
                <p className="font-semibold text-white">nombre del desafio</p>
                <p className="text-xs text-slate-400 font-mono">tipo del desafio</p>
              </div>
              <span className="text-green-400 text-sm">Aprobado</span>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:border-red-500 transition">
              <div>
                <p className="font-semibold text-white">nombre del desafio</p>
                <p className="text-xs text-slate-400 font-mono">tipo del desafio</p>
              </div>
              <span className="text-yellow-400 text-sm">En Revision</span>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:border-red-500 transition">
              <div>
                <p className="font-semibold text-white">nombre del desafio</p>
                <p className="text-xs text-slate-400 font-mono">tipo del desafio</p>
              </div>
              <span className="text-slate-300 text-sm">En Proceso</span>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center hover:border-red-600 transition">
              <div>
                <p className="font-semibold text-white">nombre del desafio</p>
                <p className="text-xs text-slate-400 font-mono">tipo del desafio</p>
              </div>
              <span className="text-red-500 text-sm font-semibold">Fallido</span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}

*/



export default function Dashboard() {
 
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <header className="border-b border-primary/10 bg-background-secondary">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-display text-primary"> El nombre del proyecto =? APIArena </h1>

          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-background-tertiary border border-primary/20 flex items-center justify-center text-sm"> JG </div>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-background-secondary border border-primary/20 rounded-2xl p-8 shadow-glow animate-slide-up">
          <h2 className="text-3xl font-display"> Bienvenido de nuevo, Nombre de Usuario </h2>
          <p className="mt-2 text-text-secondary"> Tu estas preparado. ¿Listo para dominar el ranking de APIArena? </p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Progreso de los Retos</span>
              <span className="text-primary font-mono">70%</span>
            </div>
            <div className="h-3 rounded-full bg-background-tertiary overflow-hidden border border-primary/10">
              <div className="h-full w-[70%] bg-primary shadow-glow" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-background-secondary border border-primary/15 rounded-xl p-6 hover:border-primary/40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Racha</p>
                <p className="text-3xl font-display text-primary mt-2">6 Dias</p>
            </div>

            <div className="bg-background-secondary border border-primary/15 rounded-xl p-6 hover:border-primary/40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Retos Activos</p>
                <p className="text-3xl font-display text-primary mt-2">12</p>
            </div>

            <div className="bg-background-secondary border border-primary/15 rounded-xl p-6 hover:border-primary/40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Resueltos</p>
                <p className="text-3xl font-display text-primary mt-2">38</p>
            </div>

            <div className="bg-background-secondary border border-primary/15 rounded-xl p-6 hover:border-primary/40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Porcentaje de Victoria</p>
                <p className="text-3xl font-display text-primary mt-2">74%</p>
            </div>

        </section>

        <section className="bg-background-secondary border border-primary/20 rounded-2xl p-8 shadow-glow">
        
        <h3 className="text-2xl font-display mb-6"> Desafíos Recientes </h3>

          <div className="space-y-4">
            <div className="bg-background-tertiary border border-primary/10 rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-accent text-sm"> Aprobado </span>
            </div>

            <div className="bg-background-tertiary border border-primary/10 rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-warning text-sm"> En Revision </span>
            </div>

                        <div className="bg-background-tertiary border border-primary/10 rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-error text-blue-500"> En Proceso </span>
            </div>

            <div className="bg-background-tertiary border border-primary/10 rounded-lg p-4 flex justify-between items-center hover:border-primary/30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-error text-sm"> Fallido </span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
