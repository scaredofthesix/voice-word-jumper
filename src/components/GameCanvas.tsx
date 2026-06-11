import React, { useRef, useEffect, useState } from 'react';
import { Lane, Obstacle, Sparkle, GameState, TrackStyle } from '../types';

interface GameCanvasProps {
  playerLane: Lane;
  gameState: GameState;
  gameSpeed: number;
  onCollide: () => void;
  onAvoidObstacle: (obstacleId: string) => void;
  lives: number;
  isBulletTime: boolean;
  onApproach: (currentLane: Lane) => void;
  score: number;
  level: number;
  trackStyle: TrackStyle;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  playerLane,
  gameState,
  gameSpeed,
  onCollide,
  onAvoidObstacle,
  lives,
  isBulletTime,
  onApproach,
  score,
  level,
  trackStyle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Game logic refs for physics thread synchronization
  const stateRef = useRef({
    playerLane,
    gameState,
    gameSpeed,
    isBulletTime,
    obstacles: [] as Obstacle[],
    particles: [] as Sparkle[],
    canvasWidth: 400,
    canvasHeight: 550,
    roadOffset: 0,
    playerX: 0.5, // 0 to 1
    lastObstacleSpawn: 0,
    nextSpawnDelay: 2500, // initialized to 2.5s
    vulnerabilities: true,
    blinkState: false,
    blinkTimer: 0,
    avoidedObstacleIds: new Set<string>(),
    scoreProgress: 0,
  });

  // Keep state refs in sync
  useEffect(() => {
    stateRef.current.isBulletTime = isBulletTime;
  }, [isBulletTime]);

  // Keep state refs in sync
  useEffect(() => {
    stateRef.current.playerLane = playerLane;
    // Highlight flash when switching lanes
    createLaneTransitionParticles();
  }, [playerLane]);

  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.gameSpeed = gameSpeed;
    if (gameState === 'PLAYING') {
      stateRef.current.obstacles = [];
      stateRef.current.particles = [];
      stateRef.current.avoidedObstacleIds.clear();
      stateRef.current.blinkTimer = 0;
    }
  }, [gameState, gameSpeed]);

  // Utility to launch sparkles when car switches lanes or gets rewards
  const createLaneTransitionParticles = () => {
    const s = stateRef.current;
    const laneWidth = s.canvasWidth / 3;
    const targetX = laneWidth * s.playerLane + laneWidth / 2;
    const carY = s.canvasHeight - 90;
    const colors = ['#4ADE80', '#22C55E', '#10B981', '#6EE7B7', '#FFFFFF'];
    
    for (let i = 0; i < 15; i++) {
      s.particles.push({
        id: Math.random().toString(),
        x: targetX + (Math.random() - 0.5) * 30,
        y: carY + (Math.random() - 0.5) * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 4 + 2,
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 15,
      });
    }
  };

  const createCrashParticles = (x: number, y: number) => {
    const s = stateRef.current;
    const colors = ['#EF4444', '#F97316', '#F59E0B', '#7F1D1D', '#000000'];
    for (let i = 0; i < 35; i++) {
      s.particles.push({
        id: Math.random().toString(),
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        size: Math.random() * 6 + 3,
        life: 0,
        maxLife: Math.random() * 30 + 20,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Adjust canvas resolution
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth || 400;
      canvas.height = container.clientHeight || 650;
      stateRef.current.canvasWidth = canvas.width;
      stateRef.current.canvasHeight = canvas.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial position
    const laneWidth = canvas.width / 3;
    stateRef.current.playerX = laneWidth * playerLane + laneWidth / 2;

    const obstacleColors = {
      taxi: '#FCD34D', // Yellow
      sedan: '#3B82F6', // Blue
      police: '#1F2937', // Blackish
      truck: '#EC4899', // Pink
      cone: '#F97316', // Orange
      puddle: '#60A5FA', // Water Blue
    };

    // The main engine rendering loop
    const frame = () => {
      const now = Date.now();
      const s = stateRef.current;
      const ctx = context;
      const w = s.canvasWidth;
      const h = s.canvasHeight;
      const laneW = w / 3;

      // 1. CLEAR & DRAW ROAD BACKGROUND
      if (trackStyle === 'night') {
        ctx.fillStyle = '#090d16'; // Midnight black/blue
      } else if (trackStyle === 'desert') {
        ctx.fillStyle = '#2c1e10'; // Warm dark sand brown
      } else if (trackStyle === 'city') {
        ctx.fillStyle = '#1e293b'; // Dense urban slate asphalt
      } else {
        ctx.fillStyle = '#111827'; // Forest dark base
      }
      ctx.fillRect(0, 0, w, h);

      // Draw highway shoulders depending on style
      if (trackStyle === 'night') {
        ctx.fillStyle = '#111827'; // Dark side margins
        ctx.fillRect(0, 0, 16, h);
        ctx.fillRect(w - 16, 0, 16, h);
        ctx.fillStyle = '#4f46e5'; // Glowing indigo line
        ctx.fillRect(16, 0, 4, h);
        ctx.fillRect(w - 20, 0, 4, h);
      } else if (trackStyle === 'desert') {
        ctx.fillStyle = '#d97706'; // Golden desert sand
        ctx.fillRect(0, 0, 16, h);
        ctx.fillRect(w - 16, 0, 16, h);
        ctx.fillStyle = '#b45309'; // Red sand border
        ctx.fillRect(16, 0, 4, h);
        ctx.fillRect(w - 20, 0, 4, h);
      } else if (trackStyle === 'city') {
        ctx.fillStyle = '#475569'; // Urban concrete sidewalk gray
        ctx.fillRect(0, 0, 16, h);
        ctx.fillRect(w - 16, 0, 16, h);
        ctx.fillStyle = '#06b6d4'; // Bright neon division line
        ctx.fillRect(16, 0, 4, h);
        ctx.fillRect(w - 20, 0, 4, h);
      } else {
        // 'forest' (default)
        ctx.fillStyle = '#065f46'; // Forest green
        ctx.fillRect(0, 0, 16, h);
        ctx.fillRect(w - 16, 0, 16, h);
        ctx.fillStyle = '#059669'; // Lighter green strip
        ctx.fillRect(16, 0, 4, h);
        ctx.fillRect(w - 20, 0, 4, h);
      }

      // Draw dynamic scrolling decorations on the shoulders
      const itemSpacing = 160;
      const shoulderScrollY = (s.roadOffset * 2) % itemSpacing;
      for (let by = shoulderScrollY - itemSpacing; by < h + itemSpacing; by += itemSpacing) {
        
        const drawDecor = (x: number) => {
          ctx.save();
          if (trackStyle === 'night') {
            // Neon Street Lamps
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, by + 10);
            ctx.lineTo(x, by - 12);
            ctx.stroke();

            // Lamp cap
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.roundRect(x - 4, by - 14, 8, 3, 1);
            ctx.fill();

            // Glow source
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(x, by - 11, 4, 0, Math.PI * 2);
            ctx.fill();

            // High contrast ground light halo
            ctx.fillStyle = 'rgba(253, 224, 71, 0.16)';
            ctx.beginPath();
            ctx.arc(x, by + 10, 16, 0, Math.PI * 2);
            ctx.fill();

          } else if (trackStyle === 'desert') {
            // Saguaro Cactus
            ctx.fillStyle = '#15803d'; // Green
            ctx.beginPath();
            ctx.roundRect(x - 3, by - 12, 6, 24, 3); // Center trunk
            ctx.fill();

            // Branch left
            ctx.beginPath();
            ctx.roundRect(x - 8, by - 4, 6, 3, 1.5);
            ctx.roundRect(x - 8, by - 9, 3, 6, 1);
            ctx.fill();

            // Branch right
            ctx.beginPath();
            ctx.roundRect(x + 2, by - 8, 6, 3, 1.5);
            ctx.roundRect(x + 5, by - 13, 3, 6, 1);
            ctx.fill();

          } else if (trackStyle === 'city') {
            // Cyber Urban Bollards (Square concrete with glowing indicators)
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(x - 5, by - 8, 10, 16, 2);
            ctx.fill();

            // Neon cyan signal glow
            ctx.fillStyle = (Math.floor(now / 200) % 2 === 0) ? '#06b6d4' : '#0891b2';
            ctx.beginPath();
            ctx.arc(x, by - 4, 3, 0, Math.PI * 2);
            ctx.fill();

            // Warning yellow stripe on bottom
            ctx.fillStyle = '#eab308';
            ctx.fillRect(x - 5, by + 4, 10, 3);

          } else {
            // 'forest' (Pine Trees)
            ctx.fillStyle = '#14532d'; // Dark pine green
            ctx.beginPath();
            ctx.moveTo(x, by - 14);
            ctx.lineTo(x - 7, by);
            ctx.lineTo(x + 7, by);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#15803d'; // Lighter pine level
            ctx.beginPath();
            ctx.moveTo(x, by - 4);
            ctx.lineTo(x - 9, by + 10);
            ctx.lineTo(x + 9, by + 10);
            ctx.closePath();
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#78350f'; // Brown
            ctx.fillRect(x - 2, by + 10, 4, 5);
          }
          ctx.restore();
        };

        // Draw on left and right shoulder margins
        drawDecor(8);
        drawDecor(w - 8);
      }

      // 2. SCROLLING ROAD STRIPES (Slowing down to 5% speed during bullet-time!)
      const speedMultiplier = s.isBulletTime ? 0.05 : 1.0;
      s.roadOffset = (s.roadOffset + s.gameSpeed * speedMultiplier) % 80;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 50]);
      
      // Draw 2 dividing lane dash lines (reversing scroll starts at offset - 80 and shifts forward/down!)
      ctx.beginPath();
      ctx.moveTo(laneW, s.roadOffset - 80);
      ctx.lineTo(laneW, h + 80);
      ctx.moveTo(laneW * 2, s.roadOffset - 80);
      ctx.lineTo(laneW * 2, h + 80);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Lane labels/lines on background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(laneW * s.playerLane, 0, laneW, h);

      // 3. PHYSICAL SPAWN OF TRAFFIC (Only if playing)
      if (s.gameState === 'PLAYING') {
        const spawnDelay = s.nextSpawnDelay || 2500;
        
        // Spawn strictly when no active obstacles are on screen
        if (s.obstacles.length === 0 && now - s.lastObstacleSpawn > spawnDelay) {
          // Strictly spawn on player's current lane to block them!
          const chosenLane: Lane = s.playerLane;
          
          const types: ('truck' | 'police' | 'taxi' | 'sedan')[] = ['taxi', 'sedan', 'police', 'truck'];
          const chosenType = types[Math.floor(Math.random() * types.length)];
          
          s.obstacles.push({
            id: Math.random().toString(),
            lane: chosenLane,
            y: -100, // offscreen top
            speed: s.gameSpeed * 0.45 + (chosenType === 'police' ? 1.5 : chosenType === 'truck' ? -1 : 0),
            type: chosenType,
            color: obstacleColors[chosenType],
          });
          
          s.lastObstacleSpawn = now;
          // Strictly 2 to 3 seconds interval for the next spawn
          s.nextSpawnDelay = Math.floor(Math.random() * 1000) + 2000;
        }
      }

      // 4. PHYSICS UPDATE FOR OBSTACLES
      s.obstacles.forEach((obs, index) => {
        // Trigger approach (bullet-time) once it gets close (y >= 100)
        if (s.gameState === 'PLAYING' && obs.lane === s.playerLane && obs.y >= 100 && !s.isBulletTime && !s.avoidedObstacleIds.has(obs.id)) {
          s.isBulletTime = true;
          // Notify App to activate bullet-time, reset timer, and generate words on alternative lanes
          onApproach(s.playerLane);
        }

        // Move downward: during bullet time, the obstacle crawls. 
        // Once dodged (the player changes lane, obs.lane !== s.playerLane), it zooms downward at 3x normal speed!
        const isDodged = obs.lane !== s.playerLane;
        const speedFactor = isDodged ? 3.0 : speedMultiplier;
        obs.y += (obs.speed + s.gameSpeed * 0.5) * speedFactor;

        // Draw obstacle
        const obsX = laneW * obs.lane + laneW / 2;
        const obsY = obs.y;

        // Check if player has safely avoided this obstacle
        const carY = h - 90;
        if (obsY > carY + 40 && !s.avoidedObstacleIds.has(obs.id)) {
          s.avoidedObstacleIds.add(obs.id);
          // Callback to award points
          onAvoidObstacle(obs.id);
        }

        // Draw Obstacle Graphic (Slower traffic ahead of us, facing forward)
        ctx.save();
        ctx.translate(obsX, obsY);

        if (obs.type === 'cone') {
          // Large chunky safety cone with massive orange glow (perfect for kids!)
          const pulseGlow = Math.sin(now / 150) * 0.4 + 0.6;
          
          // Outer massive warning glow circle
          ctx.fillStyle = `rgba(249, 115, 22, ${0.18 * pulseGlow})`;
          ctx.beginPath();
          ctx.arc(0, 12, 34, 0, Math.PI * 2);
          ctx.fill();

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 16, 20, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          // Base structure
          ctx.fillStyle = '#C2410C';
          ctx.beginPath();
          ctx.roundRect(-18, 10, 36, 10, 4);
          ctx.fill();

          // Body of cone
          ctx.beginPath();
          ctx.fillStyle = '#F97316';
          ctx.moveTo(-13, 10);
          ctx.lineTo(-4, -18);
          ctx.lineTo(4, -18);
          ctx.lineTo(13, 10);
          ctx.closePath();
          ctx.fill();

          // Thick high-contrast white retroreflective stripe
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(-10, 2);
          ctx.lineTo(-7, -6);
          ctx.lineTo(7, -6);
          ctx.lineTo(10, 2);
          ctx.closePath();
          ctx.fill();

          // LED flash tip on top
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(0, -18, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(253, 224, 71, ${pulseGlow})`;
          ctx.beginPath();
          ctx.arc(0, -18, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // PROPER ROAD-TRAFFIC MODEL (FACING UPWARD, tail lights facing player!)
          const isTruck = obs.type === 'truck';
          const carHeight = isTruck ? 84 : 56;
          const carWidth = isTruck ? 40 : 38;

          // 1. Chunky shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.roundRect(-carWidth / 2 - 3, -carHeight / 2 + 5, carWidth + 6, carHeight, 10);
          ctx.fill();

          // 2. Extra large kid-friendly wheels
          ctx.fillStyle = '#111827';
          // Front wheels (top)
          ctx.fillRect(-carWidth / 2 - 4, -carHeight/3 - 6, 5, 14);
          ctx.fillRect(carWidth / 2 - 1, -carHeight/3 - 6, 5, 14);
          // Rear wheels (bottom)
          ctx.fillRect(-carWidth / 2 - 4, carHeight/3 - 8, 5, 14);
          ctx.fillRect(carWidth / 2 - 1, carHeight/3 - 8, 5, 14);

          if (isTruck) {
            // Heavy 6-wheeler truck middle tyres
            ctx.fillRect(-carWidth / 2 - 4, -2, 5, 14);
            ctx.fillRect(carWidth / 2 - 1, -2, 5, 14);
          }

          // Shiny hubcaps so they stand out
          ctx.fillStyle = '#D1D5DB';
          ctx.beginPath();
          ctx.arc(-carWidth / 2 - 1.5, -carHeight/3 + 1, 2, 0, Math.PI * 2);
          ctx.arc(carWidth / 2 + 1.5, -carHeight/3 + 1, 2, 0, Math.PI * 2);
          ctx.arc(-carWidth / 2 - 1.5, carHeight/3 - 1, 2, 0, Math.PI * 2);
          ctx.arc(carWidth / 2 + 1.5, carHeight/3 - 1, 2, 0, Math.PI * 2);
          ctx.fill();

          // 3. Main Vehicle Body
          if (isTruck) {
            // Large Pink Container Rig
            const containerGrad = ctx.createLinearGradient(-16, 0, 16, 0);
            containerGrad.addColorStop(0, '#BE185D');
            containerGrad.addColorStop(0.5, '#EC4899');
            containerGrad.addColorStop(1, '#9D174D');
            ctx.fillStyle = containerGrad;

            // Massive box trailer
            ctx.beginPath();
            ctx.roundRect(-16, -20, 32, 54, 4);
            ctx.fill();

            // Contrast cargo stripes
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let ry = -16; ry < 30; ry += 8) {
              ctx.fillRect(-14, ry, 28, 2.5);
            }

            // Driver cockpit cabin at the FRONT (top, facing forward!)
            const cabinGrad = ctx.createLinearGradient(-16, 0, 16, 0);
            cabinGrad.addColorStop(0, '#DB2777');
            cabinGrad.addColorStop(0.5, '#F472B6');
            cabinGrad.addColorStop(1, '#BE185D');
            ctx.fillStyle = cabinGrad;
            ctx.beginPath();
            ctx.roundRect(-15, -42, 30, 22, [6, 6, 3, 3]);
            ctx.fill();

            // Windshield (facing forward, i.e., UPWARD negative Y)
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(-11, -38, 22, 6);
            ctx.fillStyle = '#34D399'; // Friendly mint-green windshield glaze
            ctx.fillRect(-10, -37, 20, 4);

          } else {
            // Passenger Cars (Taxi, Police, Sedan/Overtake model)
            const bodyGrad = ctx.createLinearGradient(-carWidth / 2, 0, carWidth / 2, 0);
            if (obs.type === 'police') {
              bodyGrad.addColorStop(0, '#1E293B');
              bodyGrad.addColorStop(0.5, '#475569');
              bodyGrad.addColorStop(1, '#0F172A');
            } else if (obs.type === 'taxi') {
              bodyGrad.addColorStop(0, '#D97706');
              bodyGrad.addColorStop(0.5, '#FBBF24');
              bodyGrad.addColorStop(1, '#B45309');
            } else {
              bodyGrad.addColorStop(0, '#047857');
              bodyGrad.addColorStop(0.5, '#10B981'); // kids emerald green sedan
              bodyGrad.addColorStop(1, '#065F46');
            }

            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.roundRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight, [12, 12, 12, 12]);
            ctx.fill();

            // Decal / details
            if (obs.type === 'taxi') {
              // Top yellow TAXI cap
              ctx.fillStyle = '#111827';
              ctx.fillRect(-10, -2, 20, 5);
              ctx.fillStyle = '#FBBF24';
              ctx.fillRect(-8, -1, 16, 3);
            } else if (obs.type === 'police') {
              // Big police flashing light bar on top of roof
              const flashingState = Math.floor(now / 150) % 2 === 0;
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(-11, -2, 22, 5);
              ctx.fillStyle = flashingState ? '#EF4444' : '#3B82F6';
              ctx.fillRect(-9, -1, 9, 3);
              ctx.fillStyle = !flashingState ? '#EF4444' : '#3B82F6';
              ctx.fillRect(0, -1, 9, 3);

              // Large warning glow circle
              ctx.fillStyle = flashingState ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
              ctx.beginPath();
              ctx.arc(0, 0, 40, 0, Math.PI * 2);
              ctx.fill();
            }

            // Windshield glass & Glare facing FORWARD (upward, negative Y)
            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(-12, -18, 24, 10, [4, 4, 0, 0]);
            ctx.fill();
            ctx.fillStyle = '#60A5FA'; // vibrant sky blue glass
            ctx.beginPath();
            ctx.roundRect(-11, -17, 22, 8, [3, 3, 0, 0]);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-6, -17, 4, 6); // windshield light glare

            // Rear window glass facing BACK (downward/towards the player, positive Y)
            ctx.fillStyle = '#0F172A';
            ctx.beginPath();
            ctx.roundRect(-11, 10, 22, 8, [0, 0, 4, 4]);
            ctx.fill();
            ctx.fillStyle = '#2563EB';
            ctx.beginPath();
            ctx.roundRect(-10, 11, 20, 6, [0, 0, 3, 3]);
            ctx.fill();
          }

          // 4. BIG BRIGHT RED SAFETY TAIL LIGHTS (Facing the player!)
          // Kids can clearly see these are rear bumpers we are catching up to!
          ctx.fillStyle = '#EF4444';
          // Lower-left brake light
          ctx.beginPath();
          ctx.roundRect(-carWidth/2 + 2, carHeight/2 - 5, 8, 4, 1.5);
          ctx.fill();
          // Lower-right brake light
          ctx.beginPath();
          ctx.roundRect(carWidth/2 - 10, carHeight/2 - 5, 8, 4, 1.5);
          ctx.fill();

          // Big fuzzy red brake-glow effect
          ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.beginPath();
          ctx.arc(-carWidth/2 + 6, carHeight/2 - 3, 10, 0, Math.PI * 2);
          ctx.arc(carWidth/2 - 6, carHeight/2 - 3, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        
        // COLLISION CHECK
        if (s.gameState === 'PLAYING') {
          const carHeight = 78; // Larger player size values
          const carWidth = 42;
          const playerY = h - 90;
          
          const obsSizeY = obs.type === 'cone' ? 36 : obs.type === 'truck' ? 84 : 56;
          const obsSizeX = obs.type === 'cone' ? 32 : obs.type === 'truck' ? 40 : 38;

          // Check coordinate intersection
          const isSameLane = obs.lane === s.playerLane;
          // Very generous overlap bounds subtraction for user/kid-friendly controls
          const overlapY = Math.abs(obsY - playerY) < (carHeight / 2 + obsSizeY / 2 - 28);
          
          if (isSameLane && overlapY && s.blinkTimer <= 0) {
            // Collision triggered
            createCrashParticles(obsX, obsY);
            s.blinkTimer = 100; // blink frames for vulnerability shield
            onCollide();
            // Delete this obstacle, so it doesn't double crash
            s.obstacles.splice(index, 1);
          }
        }
      });

      // Filter out of bounds obstacles
      s.obstacles = s.obstacles.filter(o => o.y < h + 100);

      // 5. UPDATE PLAYER VEHICLE RENDER (Slide LERP transition)
      const targetX = laneW * s.playerLane + laneW / 2;
      s.playerX += (targetX - s.playerX) * 0.18; // smooth horizontal glide

      // Handle blink logic for invincibility flash
      if (s.blinkTimer > 0) {
        s.blinkTimer--;
        s.blinkState = Math.floor(s.blinkTimer / 4) % 2 === 0;
      } else {
        s.blinkState = false;
      }

      // Draw player car if not blinked out
      if (!s.blinkState) {
        const carY = h - 90;
        
        ctx.save();
        ctx.translate(s.playerX, carY);

        // 1. Shadow underneath player cyber-car
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.roundRect(-24, -38, 48, 76, 14);
        ctx.fill();

        // 2. Neon-lit ground-effects underglow
        ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; // glowing cyan cyber underglow
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.fill();

        // 3. Immersive detailed tires with visible glowing rims
        ctx.fillStyle = '#0F172A'; // rubber core
        const wheelYOffs = [-24, 16];
        wheelYOffs.forEach((wy) => {
          // Left wheels
          ctx.beginPath();
          ctx.roundRect(-23, wy, 6, 14, 3);
          ctx.fill();
          // Right wheels
          ctx.beginPath();
          ctx.roundRect(17, wy, 6, 14, 3);
          ctx.fill();

          // Cyber metallic hub rims in the centers
          ctx.fillStyle = '#22D3EE';
          ctx.fillRect(-22.5, wy + 4, 2.5, 6);
          ctx.fillRect(19.5, wy + 4, 2.5, 6);
        });

        // 4. Main Supercar chassis (Red body base with carbon texture sides)
        const carGrad = ctx.createLinearGradient(-18, 0, 18, 0);
        carGrad.addColorStop(0, '#DC2626');  // Bold sports car red
        carGrad.addColorStop(0.5, '#EF4444'); // Vivid electric red core
        carGrad.addColorStop(1, '#991B1B');  // Deep shadow burgundy
        
        ctx.fillStyle = carGrad;
        ctx.beginPath();
        // Sleek aerodynamic front nose cone and curving back diffuser (scaled up!)
        ctx.roundRect(-18, -36, 36, 72, [14, 14, 8, 8]);
        ctx.fill();

        // Aerodynamic carbon fiber front splitters (fins)
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-20, -32, 2.5, 12);
        ctx.fillRect(17.5, -32, 2.5, 12);

        // Carbon racing dual decal stripes on the hood
        ctx.fillStyle = '#111827';
        ctx.fillRect(-5, -28, 3, 54);
        ctx.fillRect(2, -28, 3, 54);
        ctx.fillStyle = '#F43F5E'; // rose accent highlights
        ctx.fillRect(-5, -12, 1.5, 24);
        ctx.fillRect(3.5, -12, 1.5, 24);

        // 5. Glossy Cyber cabin glass with dynamic glare reflection
        const cabinGrad = ctx.createLinearGradient(-12, -12, 12, 12);
        cabinGrad.addColorStop(0, '#0F172A');
        cabinGrad.addColorStop(1, '#0284C7'); // Cyan glass reflection
        ctx.fillStyle = cabinGrad;
        ctx.beginPath();
        ctx.roundRect(-12, -15, 24, 26, 7);
        ctx.fill();

        // Cabin internal cyber heads-up glow
        ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.beginPath();
        ctx.arc(-2, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glossy sun streaks/glare across windshield
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-8, -11);
        ctx.lineTo(3, -4);
        ctx.stroke();

        // 6. Laser Headlights (At the FRONT bumper, i.e., top negative Y)
        const pBeamLength = 140;
        const pBeamGrad = ctx.createLinearGradient(0, -34, 0, -34 - pBeamLength);
        pBeamGrad.addColorStop(0, 'rgba(34, 211, 238, 0.55)');
        pBeamGrad.addColorStop(0.35, 'rgba(34, 211, 238, 0.25)');
        pBeamGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
        
        ctx.fillStyle = pBeamGrad;
        ctx.beginPath();
        ctx.moveTo(-15, -32);
        ctx.lineTo(-38, -32 - pBeamLength);
        ctx.lineTo(38, -32 - pBeamLength);
        ctx.lineTo(15, -32);
        ctx.closePath();
        ctx.fill();

        // Active glowing head lamps
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(-12, -33, 3, 0, Math.PI * 2);
        ctx.arc(12, -33, 3, 0, Math.PI * 2);
        ctx.fill();

        // 7. Raised GT sports spoiler (Corrected at the BACK bumper, i.e. bottom positive Y!)
        // Spoiler wing mounts
        ctx.fillStyle = '#450A0A';
        ctx.fillRect(-16, 28, 4, 10);
        ctx.fillRect(12, 28, 4, 10);

        // Spoiler main horizontal wing bar across back body
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.roundRect(-22, 34, 44, 5, 2);
        ctx.fill();

        // End winglets (Red points)
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-23, 31, 2, 9);
        ctx.fillRect(21, 31, 2, 9);

        // 8. Dynamic dual thrust twin-exhaust flame particles (Drawn at the REAR exhaust pipes, shooting DOWNWARDS!)
        if (s.gameState === 'PLAYING') {
          const fireHeight = Math.random() * 20 + 12;
          
          // Exhaust 1 (Left - bottom rear edge +36)
          const leftExGrad = ctx.createLinearGradient(-11, 36, -11, 36 + fireHeight);
          leftExGrad.addColorStop(0, '#22D3EE'); // Cyber cyan flame core
          leftExGrad.addColorStop(0.4, '#EC4899'); // Neon pink flame body
          leftExGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
          ctx.fillStyle = leftExGrad;
          ctx.beginPath();
          ctx.moveTo(-14, 36);
          ctx.lineTo(-11, 36 + fireHeight);
          ctx.lineTo(-8, 36);
          ctx.closePath();
          ctx.fill();

          // Exhaust 2 (Right - bottom rear edge +36)
          const rightExGrad = ctx.createLinearGradient(11, 36, 11, 36 + fireHeight);
          rightExGrad.addColorStop(0, '#22D3EE');
          rightExGrad.addColorStop(0.4, '#EC4899');
          rightExGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
          ctx.fillStyle = rightExGrad;
          ctx.beginPath();
          ctx.moveTo(8, 36);
          ctx.lineTo(11, 36 + fireHeight);
          ctx.lineTo(14, 36);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      // 6. DRAW PARTICLES (Exhaust fire, sparkles, lane switch debris, coin pop, crash dust)
      s.particles.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;

        const alpha = Math.max(0, 1 - part.life / part.maxLife);
        ctx.fillStyle = part.color;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        // Glow sparkles can be small rectangles or circles
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1.0; // reset

        if (part.life >= part.maxLife) {
          s.particles.splice(index, 1);
        }
      });

      // Repeat animation next frame
      animationFrameId.current = requestAnimationFrame(frame);
    };

    // Run engine
    frame();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [lives]); // Redraw triggers on lives adjustment

  return (
    <div className="relative w-full h-[460px] md:h-[650px] overflow-hidden bg-slate-950 border-4 border-slate-700 rounded-3xl shadow-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
        id="voice-racer-game-canvas"
      />
      
      {/* Heads Up Speed Display & Dashboard details */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap justify-between gap-2 z-40" id="dashboard-stats-overlay">
        <div className="flex gap-2">
          <div className="bg-slate-900/85 backdrop-blur-md text-emerald-400 font-mono text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SPEED: <span className="font-bold">{(gameSpeed * 10).toFixed(0)} MPH</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md text-red-400 font-mono text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
            LIVES: <span className="font-bold">{'■'.repeat(lives) || 'NONE'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-slate-900/85 backdrop-blur-md text-sky-400 font-mono text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
            SCORE: <span className="font-bold">{score}</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md text-purple-400 font-mono text-xs px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
            LEVEL: <span className="font-bold">{level}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
