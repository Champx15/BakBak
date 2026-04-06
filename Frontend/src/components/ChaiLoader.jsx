import Tea from "../images/chai.gif";
import { useState, useEffect } from "react";

export default function ChaiLoader() {
  const facts = [
    "You blink less when lying",
    "Take your age, subtract 2 and add 2, that's your age",
    "Your left hand is faster than right",
    "Humans share 50% DNA with bananas",
    "Yawning is contagious… even online",
    "Females have more chance of getting pregnant than males",
    "You can’t lick your elbow (try it!)",
    "Octopuses taste with their arms",
    "Your stomach gets a new lining every 3 days",
    "A group of crows is called a murder",
    "You can't forget her :)"
  ];

  const [randomIndex, setRandomIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * facts.length);
      setRandomIndex(newIndex);
    }, 7000);

    return () => clearInterval(interval); // cleanup
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      
      <div className="text-6xl md:text-7xl">
        <img src={Tea} alt="Steaming Chai"  height={190} className="w-60 h-55" />
      </div>

      <p className="mb-15 w-[calc(100%-27px)] md:w-110 font-mono text-white/80 text-base md:text-lg text-center font-medium line-clamp-4">
        {facts[randomIndex]}
      </p>

    </div>
  );
}