import React from 'react';

export default function SquiggleText({ text, className = "" }) {
  // Split the text into an array of characters
  const characters = text.split('');

  return (
    <span style={{ display: 'inline-block' }}>
      {characters.map((char, index) => {
        // We want spaces to still take up space but not need an animation wrapper per se,
        // though animating a space does no harm.
        if (char === ' ') {
          return <span key={index} style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>;
        }

        // Apply an incremental delay to each character to create the "wave" / "squiggle" flow effect.
        // We use a small delay multiplier (e.g. 0.05s) to make it smooth.
        return (
          <span
            key={index}
            className={`animate-squiggle ${className}`}
            style={{
              display: 'inline-block',
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
