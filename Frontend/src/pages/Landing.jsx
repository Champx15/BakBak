import FloatingMessage from "../components/FloatingMessage";
import logo from "../images/logo.png"
import { useNavigate } from "react-router";

function Landing() {
  const messages = [
    "hey",
    "hi there",
    "yo",
    "hello stranger",
    "hi, what's up",
    "hello there",
    "so where you from?",
    "bored too?",
    "so how's your day",
    "you real?",
    "this your first time here?",
    "what's your vibe",
    "so... maira??",
  ];
  const navigate = useNavigate();

  return (
    <div className="h-dvh w-full bg-linear-to-b from-[#8EA5D9] to-[#638AD6]  text-white overflow-hidden relative font-[Sora]">
      {/* brand */}
<div className="absolute top-6 left-1/2 -translate-x-1/2 md:top-4 md:left-6 md:translate-x-0 flex flex-col items-center md:items-start z-10 text-center md:text-left">
  <div className="flex items-center">
    <img
      src={logo}
      alt="Logo"
      className="h-12 w-16 md:h-10 md:w-13 mr-1"
    />

    <div className="text-[3rem] md:text-[2.2rem] font-bold leading-none">
      Bak<span className="text-[#0066FF]">Bak</span>
    </div>
  </div>

  <p className="text-[0.8rem] md:text-[0.69rem] font-medium text-white/95 whitespace-nowrap">
    where strangers become conversations
  </p>
</div>

      {/* floating messages */}
      
      {messages
        .slice(0, window.innerWidth < 768 ? 13 : messages.length)
        .map((m, i) => (
          <FloatingMessage
            key={i}
            text={m}
            x={`${Math.random() * 87}%`}
            y={`${Math.random() * 90}%`}
            delay={`-${i * 1.2}s`}
          />
        ))}

      {/* central action */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <h1 className="text-[clamp(2.7rem,9vw,8rem)] font-black mb-6 leading-tight ">
          talk to someone
          <br />
          <span className="text-[#0066FF]">random</span>
        </h1>

        <button
          onClick={()=>navigate("/chat")}
          className="
          bg-[#0066FF]
          px-10 py-4
          md:text-lg
          text-xl
          font-semibold
          rounded-md
          hover:scale-105
          transition
          "
        >
          start talking
        </button>
        <p className="absolute md:bottom-6 bottom-8 text-white/50 text-sm">
          no account • totally anonymous • 100% free
        </p>
      </div>
    </div>
  );
}

export default Landing;
