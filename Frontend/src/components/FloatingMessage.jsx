function FloatingMessage({text, x, y, delay}) {
  return (
    <div
      // className="absolute text-sm text-[#9bbcff] font-mono opacity-80"
      className="absolute md:text-sm text-xs text-white/80 font-mono pointer-events-none 
  whitespace-nowrap 
  md:px-4 py-2 px-3
  rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/10 " 
      style={{
        left: x,
        top: y,
        animation: `drift 12s linear infinite`,
        animationDelay: delay,
        willChange: "transform, opacity"
          }}
    >
      {text}
    </div>
  )
}

export default FloatingMessage;