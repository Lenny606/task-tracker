export function Divider() {
  return (
    <div className="relative py-4 px-2 flex items-center justify-center" role="separator">
      <div className="absolute inset-x-2 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-800"></div>
      </div>
      <div className="relative flex justify-center">
        <span className="bg-slate-950 px-3">
          <div className="w-1.5 h-1.5 rotate-45 bg-slate-500 shadow-sm" />
        </span>
      </div>
    </div>
  )
}
