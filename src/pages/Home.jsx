import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <section className="px-8 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Plan Smarter, Study Better with{" "}
          <span className="text-cyan-400">PrepPilot</span>
        </h1>

        <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
          PrepPilot helps students create smart study plans, track progress,
          and prepare for exams with confidence.
        </p>

        <button className="bg-cyan-400 text-slate-950 px-8 py-3 rounded-xl font-semibold hover:bg-cyan-300">
          Get Started
        </button>
      </section>
    </div>
  );
}

export default Home;