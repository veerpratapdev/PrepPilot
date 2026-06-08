function ProgressBar({ progress }) {
  return (
    <div className="mt-4">
      <div className="w-full bg-slate-700 rounded-full h-3">
        <div
          className="bg-cyan-400 h-3 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <p className="mt-2 text-sm text-slate-300">
        {progress}% Complete
      </p>
    </div>
  );
}

export default ProgressBar;