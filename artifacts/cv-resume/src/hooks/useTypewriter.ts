import { useState, useEffect } from "react";

export function useTypewriter(words: string[], speed = 80, deleteSpeed = 40, pause = 2000) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      const timer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pause);
      return () => clearTimeout(timer);
    }

    const currentWord = words[wordIndex % words.length];

    if (!isDeleting) {
      if (displayText.length < currentWord.length) {
        const timer = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, speed);
        return () => clearTimeout(timer);
      } else {
        setIsPaused(true);
      }
    } else {
      if (displayText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
        return () => clearTimeout(timer);
      } else {
        setIsDeleting(false);
        setWordIndex((i) => i + 1);
      }
    }
  }, [displayText, wordIndex, isDeleting, isPaused, words, speed, deleteSpeed, pause]);

  return displayText;
}
