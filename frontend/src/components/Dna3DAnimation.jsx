import React, { useEffect, useState } from 'react';
import './Dna3DAnimation.css';

const Dna3DAnimation = ({ onComplete }) => {
  const [phase, setPhase] = useState('scanning'); // 'scanning', 'mutating', 'complete'

  useEffect(() => {
    // Phase 1: Scanning (2 seconds)
    const scanTimer = setTimeout(() => {
      setPhase('mutating');
      
      // Phase 2: Mutating (1.5 seconds)
      const mutateTimer = setTimeout(() => {
        setPhase('complete');
        
        // Phase 3: Complete & Close (1.5 seconds)
        const closeTimer = setTimeout(() => {
          if (onComplete) onComplete();
        }, 1500);
        
        return () => clearTimeout(closeTimer);
      }, 1500);
      
      return () => clearTimeout(mutateTimer);
    }, 2000);

    return () => clearTimeout(scanTimer);
  }, [onComplete]);

  // Generate 20 base pairs
  const basePairs = Array.from({ length: 20 }).map((_, i) => {
    const rotation = i * 18; // 18 degrees per step
    const yPos = i * 15; // 15px apart
    return (
      <div 
        key={i} 
        className="base-pair"
        style={{ 
          top: `${yPos}px`,
          transform: `rotateY(${rotation}deg)` 
        }}
      ></div>
    );
  });

  return (
    <div className="dna-simulation-overlay">
      <div className={`dna-container ${phase === 'mutating' ? 'mutating' : ''}`}>
        <div className="dna-strand">
          {basePairs}
        </div>
      </div>
      
      <div className={`simulation-text ${phase === 'mutating' ? 'mutating' : ''}`}>
        {phase === 'scanning' && 'Scanning Sequence...'}
        {phase === 'mutating' && 'Injecting Biological Mutation...'}
        {phase === 'complete' && 'Mutation Complete. DNA Corrupted.'}
      </div>
    </div>
  );
};

export default Dna3DAnimation;
