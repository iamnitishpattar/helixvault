import React from 'react';
import { Dna } from 'lucide-react';
import './HelixBackground.css';

export default function HelixBackground() {
  return (
    <div className="helix-bg-container">
      <div className="helix-watermark">
        <Dna strokeWidth={0.5} />
      </div>
      {/* Subtle radial gradient overlay to make the helix fade into the black background at the edges */}
      <div className="helix-gradient-mask"></div>
    </div>
  );
}
