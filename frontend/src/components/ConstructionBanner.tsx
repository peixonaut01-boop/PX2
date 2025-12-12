"use client";

import { useState, useEffect } from 'react';

const emojis = ['🚧', '🔨', '⚙️', '🛠️', '👷', '📊', '💹', '🏗️'];

export function ConstructionBanner() {
  const [emojiIndex, setEmojiIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="construction-banner w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2 px-4 text-center text-sm font-medium">
      <span className="inline-block w-6 text-lg animate-bounce">
        {emojis[emojiIndex]}
      </span>
      {' '}
      <span>Site em construção - Novas funcionalidades em breve!</span>
      {' '}
      <span className="inline-block w-6 text-lg animate-bounce">
        {emojis[emojiIndex]}
      </span>
    </div>
  );
}

