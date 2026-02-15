import Header from "../components/Header";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header title="APIArena" />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-background-secondary border border-primary-20 rounded-2xl p-8 shadow-glow animate-slide-up">
          <h2 className="text-3xl font-display"> Bienvenido de nuevo, Nombre de Usuario </h2>
          <p className="mt-2 text-text-secondary"> Tu estas preparado. ¿Listo para dominar el ranking de APIArena? </p>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Progreso de los Retos</span>
              <span className="text-primary font-mono">70%</span>
            </div>
            <div className="h-3 rounded-full bg-background-tertiary overflow-hidden border border-primary-10">
              <div className="h-full w-[70%] bg-primary shadow-glow" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-background-secondary border border-primary-15 rounded-xl p-6 hover:border-primary-40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Racha</p>
                <p className="text-3xl font-display text-primary mt-2">6 Dias</p>
            </div>

            <div className="bg-background-secondary border border-primary-15 rounded-xl p-6 hover:border-primary-40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Retos Activos</p>
                <p className="text-3xl font-display text-primary mt-2">12</p>
            </div>

            <div className="bg-background-secondary border border-primary-15 rounded-xl p-6 hover:border-primary-40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Resueltos</p>
                <p className="text-3xl font-display text-primary mt-2">38</p>
            </div>

            <div className="bg-background-secondary border border-primary-15 rounded-xl p-6 hover:border-primary-40 transition shadow-glow">
                <p className="text-sm text-text-secondary">Porcentaje de Victoria</p>
                <p className="text-3xl font-display text-primary mt-2">74%</p>
            </div>

        </section>

        <section className="bg-background-secondary border border-primary-20 rounded-2xl p-8 shadow-glow">
        
        <h3 className="text-2xl font-display mb-6"> Desafíos Recientes </h3>

          <div className="space-y-4">
            <div className="bg-background-tertiary border border-primary-10 rounded-lg p-4 flex justify-between items-center hover:border-primary-30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-accent text-sm"> Aprobado </span>
            </div>

            <div className="bg-background-tertiary border border-primary-10 rounded-lg p-4 flex justify-between items-center hover:border-primary-30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-warning text-sm"> En Revision </span>
            </div>

                        <div className="bg-background-tertiary border border-primary-10 rounded-lg p-4 flex justify-between items-center hover:border-primary-30 transition">
              <div>
                <p className="font-semibold">nombre del desafio</p>
                <p className="text-xs text-text-muted font-mono"> tipo del desafio </p>
              </div>
              <span className="text-error"> En Proceso </span>
            </div>

            <div className="bg-background-tertiary border border-primary-10 rounded-lg p-4 flex justify-between items-center hover:border-primary-30 transition">
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
