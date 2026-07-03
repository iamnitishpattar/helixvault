import React, { useRef, useEffect } from 'react';

const InteractiveDNA = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let mouse = { x: -1000, y: -1000 };
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

    const colors = ['#00f3ff', '#ff00ff', '#7000ff', '#00ffd5', '#ff00aa'];
    const numArms = 5;
    const pointsPerArm = 120;
    
    // Create the base structure of the vortex
    const basePoints = [];
    for (let arm = 0; arm < numArms; arm++) {
      for (let i = 0; i < pointsPerArm; i++) {
        basePoints.push({
          arm: arm,
          index: i,
          // Radius grows exponentially or linearly. Let's do a curved spiral.
          radius: Math.pow(i, 1.3) * 1.5,
          // Angle offsets slightly per point to create the curve of the arm
          angleOffset: (arm * (Math.PI * 2) / numArms) + (i * 0.05),
          color: colors[arm % colors.length],
          currentX: 0,
          currentY: 0,
          vx: 0,
          vy: 0
        });
      }
    }

    const render = () => {
      // Create a nice trail effect by not clearing completely
      ctx.fillStyle = 'rgba(10, 5, 16, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      time += 0.015; // Global rotation speed

      // First pass: calculate target positions and apply spring physics
      basePoints.forEach(p => {
        // Calculate where the point SHOULD be in the rotating spiral
        const targetAngle = p.angleOffset + time + (Math.sin(time + p.index * 0.05) * 0.2); // Adding a breathing effect
        const targetX = cx + Math.cos(targetAngle) * p.radius;
        const targetY = cy + Math.sin(targetAngle) * p.radius;

        // Apply mouse repel force
        let repelX = 0;
        let repelY = 0;
        const dx = mouse.x - targetX;
        const dy = mouse.y - targetY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 180) {
          const force = Math.pow((180 - dist) / 180, 2); // Non-linear force for snappy response
          repelX = -(dx / dist) * force * 100;
          repelY = -(dy / dist) * force * 100;
        }

        // Spring physics towards target + repel
        p.vx += ((targetX + repelX) - p.currentX) * 0.1;
        p.vy += ((targetY + repelY) - p.currentY) * 0.1;
        
        // Friction
        p.vx *= 0.8;
        p.vy *= 0.8;

        // Init position on first frame to prevent flying in from (0,0)
        if (p.currentX === 0 && p.currentY === 0) {
          p.currentX = targetX;
          p.currentY = targetY;
        } else {
          p.currentX += p.vx;
          p.currentY += p.vy;
        }
      });

      // Second pass: Draw the glowing arms
      for (let arm = 0; arm < numArms; arm++) {
        ctx.beginPath();
        const armPoints = basePoints.filter(p => p.arm === arm);
        
        for (let i = 0; i < armPoints.length; i++) {
          const p = armPoints[i];
          if (i === 0) {
            ctx.moveTo(p.currentX, p.currentY);
          } else {
            // Smooth bezier curves between points
            const prev = armPoints[i - 1];
            const cpX = (prev.currentX + p.currentX) / 2;
            const cpY = (prev.currentY + p.currentY) / 2;
            ctx.quadraticCurveTo(prev.currentX, prev.currentY, cpX, cpY);
          }
        }
        
        ctx.strokeStyle = armPoints[0].color;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = armPoints[0].color;
        ctx.stroke();

        // Draw glowing nodes at the end of the arms
        const lastPoint = armPoints[armPoints.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.currentX, lastPoint.currentY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }

      ctx.shadowBlur = 0; // reset
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', backgroundColor: '#0a0510' }}
    />
  );
};

export default InteractiveDNA;
