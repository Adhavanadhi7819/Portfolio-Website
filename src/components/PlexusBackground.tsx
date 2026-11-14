import React, { useEffect, useRef } from 'react';
import { PlexusBackgroundConfig } from '../types/portfolio';
import {
  getResolvedBackgroundConfig,
  hexToRgb,
  rgbaStr,
  RgbColor,
  sampleCycledColor
} from '../utils/plexusColors';

interface PlexusBackgroundProps {
  config?: Partial<PlexusBackgroundConfig> | null;
}

interface DustParticle {
  xRatio: number;
  yRatio: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  twinklePhase: number;
  colorOffset: number;
}

interface PlexusNode3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseRadius: number;
  colorOffset: number;
  attractOffsetX: number;
  attractOffsetY: number;
}

interface ProjectedNode {
  sx: number;
  sy: number;
  z: number;
  depthFactor: number; // 0 (far) -> 1 (near)
  radius: number;
  alpha: number;
  rgb: RgbColor;
  blurGlow: number;
}

const FOCAL_LENGTH = 560;
const Z_NEAR = 120;
const Z_FAR = 1120;
const MAX_FACETS_PER_FRAME = 180;

export const PlexusBackground: React.FC<PlexusBackgroundProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef<PlexusBackgroundConfig>(getResolvedBackgroundConfig(config));

  useEffect(() => {
    configRef.current = getResolvedBackgroundConfig(config);
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let width = Math.max(window.innerWidth || 1280, 320);
    let height = Math.max(window.innerHeight || 720, 320);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const nodes: PlexusNode3D[] = [];
    const dust: DustParticle[] = [];

    const createNode = (zOverride?: number): PlexusNode3D => {
      const spreadX = Math.max(width * 1.15, 960);
      const spreadY = Math.max(height * 1.15, 720);
      return {
        x: (Math.random() - 0.5) * spreadX * 2,
        y: (Math.random() - 0.5) * spreadY * 2,
        z: zOverride ?? Z_NEAR + Math.random() * (Z_FAR - Z_NEAR),
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.5) * 18,
        vz: -(14 + Math.random() * 24),
        baseRadius: 1.5 + Math.random() * 2.1,
        colorOffset: Math.random() * 6,
        attractOffsetX: 0,
        attractOffsetY: 0
      };
    };

    const createDust = (): DustParticle => ({
      xRatio: Math.random(),
      yRatio: Math.random(),
      vx: (Math.random() - 0.5) * 0.008,
      vy: -(0.004 + Math.random() * 0.012),
      radius: 0.6 + Math.random() * 1.4,
      alpha: 0.14 + Math.random() * 0.36,
      twinklePhase: Math.random() * Math.PI * 2,
      colorOffset: Math.random() * 6
    });

    const getTargetCounts = () => {
      const density = configRef.current.nodeDensity || 1;
      const isMobile = width < 640;
      const isTablet = width >= 640 && width < 1024;
      const baseNodes = isMobile ? 52 : isTablet ? 78 : 106;
      const baseDust = isMobile ? 30 : isTablet ? 44 : 62;
      return {
        nodeCount: Math.max(24, Math.min(165, Math.round(baseNodes * density))),
        dustCount: Math.max(18, Math.min(90, Math.round(baseDust * density)))
      };
    };

    const syncParticlePools = () => {
      const { nodeCount, dustCount } = getTargetCounts();
      while (nodes.length < nodeCount) {
        nodes.push(createNode());
      }
      if (nodes.length > nodeCount) {
        nodes.length = nodeCount;
      }
      while (dust.length < dustCount) {
        dust.push(createDust());
      }
      if (dust.length > dustCount) {
        dust.length = dustCount;
      }
    };

    const handleResize = () => {
      width = Math.max(window.innerWidth || 1280, 320);
      height = Math.max(window.innerHeight || 720, 320);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncParticlePools();
    };

    handleResize();

    // Pointer & Scroll state with smooth lerped camera tilt
    let pointerX = width * 0.5;
    let pointerY = height * 0.45;
    let pointerActive = false;
    let targetNormX = 0;
    let targetNormY = 0;
    let parallaxX = 0;
    let parallaxY = 0;
    let smoothScrollY = window.scrollY || 0;

    const updatePointer = (clientX: number, clientY: number) => {
      pointerX = clientX;
      pointerY = clientY;
      pointerActive = true;
      targetNormX = (clientX / width - 0.5) * 2;
      targetNormY = (clientY / height - 0.5) * 2;
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) updatePointer(t.clientX, t.clientY);
    };

    const onPointerLeave = () => {
      pointerActive = false;
      targetNormX = 0;
      targetNormY = 0;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);

    let animFrameId: number | null = null;
    let lastTimestamp = performance.now();
    let colorPhase = 0;
    let timeElapsed = 0;

    const drawVoidBackdrop = (cfg: PlexusBackgroundConfig, px: number, py: number) => {
      const innerRgb = hexToRgb(cfg.voidInnerHex) || { r: 8, g: 12, b: 24 };
      const outerRgb = hexToRgb(cfg.voidOuterHex) || { r: 3, g: 5, b: 10 };

      const cx = width * 0.5 + px * 55;
      const cy = height * 0.38 + py * 40;
      const radius = Math.max(width, height) * 0.85;

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, width * 0.5, height * 0.5, radius);
      bgGrad.addColorStop(0, `rgb(${innerRgb.r}, ${innerRgb.g}, ${innerRgb.b})`);
      bgGrad.addColorStop(
        0.55,
        `rgb(${Math.round((innerRgb.r + outerRgb.r) * 0.5)}, ${Math.round(
          (innerRgb.g + outerRgb.g) * 0.5
        )}, ${Math.round((innerRgb.b + outerRgb.b) * 0.5)})`
      );
      bgGrad.addColorStop(1, `rgb(${outerRgb.r}, ${outerRgb.g}, ${outerRgb.b})`);

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    };

    const renderFrame = (now: number) => {
      const cfg = configRef.current;
      syncParticlePools();

      const rawDt = Math.max(0.001, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      const dt = Math.min(rawDt, 0.05);

      if (!prefersReducedMotion) {
        timeElapsed += dt;
        if (cfg.colorCycleEnabled) {
          colorPhase += dt * 0.16 * cfg.cycleSpeed;
        }
      }

      // Smooth Mouse & Scroll Parallax (lerp factor 0.05)
      parallaxX += (targetNormX - parallaxX) * 0.05;
      parallaxY += (targetNormY - parallaxY) * 0.05;
      smoothScrollY += ((window.scrollY || 0) - smoothScrollY) * 0.05;

      drawVoidBackdrop(cfg, parallaxX, parallaxY);

      if (!cfg.enabled) {
        animFrameId = null;
        return;
      }

      const palette: RgbColor[] = cfg.paletteHexes
        .map((hex) => hexToRgb(hex))
        .filter((c): c is RgbColor => Boolean(c));
      if (palette.length === 0) {
        palette.push({ r: 0, g: 240, b: 255 });
      }

      // Subtle atmospheric aura synced to primary cycling color
      const auraColor = sampleCycledColor(palette, colorPhase);
      const auraGrad = ctx.createRadialGradient(
        width * (0.5 + parallaxX * 0.12),
        height * (0.35 + parallaxY * 0.12),
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.55
      );
      auraGrad.addColorStop(0, rgbaStr(auraColor, 0.055));
      auraGrad.addColorStop(1, rgbaStr(auraColor, 0));
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, width, height);

      // 1. Background Micro-Dust Particles (Subtle Spatial Depth)
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        if (!prefersReducedMotion) {
          d.xRatio = (d.xRatio + d.vx * dt + 1) % 1;
          d.yRatio = (d.yRatio + d.vy * dt + 1) % 1;
        }
        const dx =
          ((d.xRatio * width - parallaxX * 14 + width) % width);
        const dy =
          ((d.yRatio * height - parallaxY * 14 - smoothScrollY * 0.03 + height) % height);
        const twinkle = 0.65 + 0.35 * Math.sin(timeElapsed * 1.4 + d.twinklePhase);
        const dRgb = sampleCycledColor(palette, colorPhase + d.colorOffset * 0.25);

        ctx.fillStyle = rgbaStr(dRgb, d.alpha * twinkle);
        ctx.beginPath();
        ctx.arc(dx, dy, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Update & Project 3D Plexus Constellation Nodes
      const yaw = parallaxX * 0.16;
      const pitch = -parallaxY * 0.12;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosX = Math.cos(pitch);
      const sinX = Math.sin(pitch);

      const halfW = width * 0.5;
      const halfH = height * 0.5;
      const spreadX = Math.max(width * 1.15, 960);
      const spreadY = Math.max(height * 1.15, 720);
      const scrollParallax = (smoothScrollY % 1200) * 0.08;

      const projected: ProjectedNode[] = [];
      const cursorRadius = cfg.cursorRadius || 180;
      const isRepel = cfg.cursorMode === 'repel';

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        if (!prefersReducedMotion) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          n.z += n.vz * dt;

          if (n.x < -spreadX) n.x = spreadX;
          if (n.x > spreadX) n.x = -spreadX;
          if (n.y < -spreadY) n.y = spreadY;
          if (n.y > spreadY) n.y = -spreadY;

          // Smooth tunnel wrap: nodes drifting toward viewer recycle seamlessly into far horizon
          if (n.z < Z_NEAR) {
            n.z = Z_FAR;
            n.x = (Math.random() - 0.5) * spreadX * 1.85;
            n.y = (Math.random() - 0.5) * spreadY * 1.85;
            n.attractOffsetX = 0;
            n.attractOffsetY = 0;
          }
        }

        // Rotate in 3D space around tilted camera axes
        const rx = n.x * cosY - n.z * sinY * 0.25;
        const rz1 = n.x * sinY * 0.25 + n.z * cosY;
        const ry = (n.y - scrollParallax) * cosX - rz1 * sinX * 0.18;
        const rz = Math.max(Z_NEAR * 0.85, (n.y - scrollParallax) * sinX * 0.18 + rz1 * cosX);

        const perspective = FOCAL_LENGTH / (FOCAL_LENGTH + rz);
        let sx = halfW + rx * perspective - parallaxX * 42 * perspective;
        let sy = halfH + ry * perspective - parallaxY * 42 * perspective;

        // Cursor gentle attraction / repulsion offset in screen space
        let targetAttractX = 0;
        let targetAttractY = 0;
        if (pointerActive && !prefersReducedMotion) {
          const dx = pointerX - (sx + n.attractOffsetX);
          const dy = pointerY - (sy + n.attractOffsetY);
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < cursorRadius) {
            const strength = (1 - dist / cursorRadius) * 28 * (isRepel ? -1.15 : 1);
            targetAttractX = (dx / dist) * strength;
            targetAttractY = (dy / dist) * strength;
          }
        }
        n.attractOffsetX += (targetAttractX - n.attractOffsetX) * 0.08;
        n.attractOffsetY += (targetAttractY - n.attractOffsetY) * 0.08;

        sx += n.attractOffsetX;
        sy += n.attractOffsetY;

        // Skip particles completely off-viewport (generous bleed margin so edge triangles stay clean)
        if (sx < -160 || sx > width + 160 || sy < -160 || sy > height + 160) {
          continue;
        }

        const depthFactor = 1 - Math.max(0, Math.min(1, (rz - Z_NEAR) / (Z_FAR - Z_NEAR)));
        const horizonFade = Math.min(1, depthFactor * 2.2);
        const nearFade = Math.min(1, (rz - Z_NEAR + 40) / 80);
        const alpha = (0.28 + depthFactor * 0.72) * horizonFade * nearFade;
        const radius = Math.max(0.85, n.baseRadius * (0.48 + depthFactor * 1.18));
        const blurGlow = radius * (2.6 + (1 - depthFactor) * 3.4);

        const nodePhase = colorPhase + n.colorOffset * 0.35 + (1 - depthFactor) * 0.65;
        const rgb = sampleCycledColor(palette, nodePhase);

        projected.push({
          sx,
          sy,
          z: rz,
          depthFactor,
          radius,
          alpha,
          rgb,
          blurGlow
        });
      }

      // 3. Build Adjacency & Render Translucent Polygonal Facets + Luminous Mesh Lines
      const linkDist = width < 640 ? 128 : 168;
      const linkDistSq = linkDist * linkDist;
      const count = projected.length;
      const neighbors: number[][] = Array.from({ length: count }, () => []);

      for (let i = 0; i < count; i++) {
        const a = projected[i];
        for (let j = i + 1; j < count; j++) {
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const distSq = dx * dx + dy * dy;
          if (distSq < linkDistSq) {
            neighbors[i].push(j);
          }
        }
      }

      // 3a. Translucent Polygonal Triangle Shards (Crystalline Geometric Facets)
      let drawnFacets = 0;
      const maxFacetAlpha = cfg.facetOpacity;

      for (let i = 0; i < count && drawnFacets < MAX_FACETS_PER_FRAME; i++) {
        const nbrs = neighbors[i];
        if (nbrs.length < 2) continue;
        const a = projected[i];

        for (let ni = 0; ni < nbrs.length && drawnFacets < MAX_FACETS_PER_FRAME; ni++) {
          const j = nbrs[ni];
          const b = projected[j];

          for (let nj = ni + 1; nj < nbrs.length && drawnFacets < MAX_FACETS_PER_FRAME; nj++) {
            const k = nbrs[nj];
            const c = projected[k];
            const bcDx = b.sx - c.sx;
            const bcDy = b.sy - c.sy;
            const bcDistSq = bcDx * bcDx + bcDy * bcDy;

            if (bcDistSq < linkDistSq) {
              const avgDepth = (a.depthFactor + b.depthFactor + c.depthFactor) / 3;
              const abDist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
              const acDist = Math.hypot(a.sx - c.sx, a.sy - c.sy);
              const bcDist = Math.sqrt(bcDistSq);
              const maxEdge = Math.max(abDist, acDist, bcDist);
              const edgeFade = Math.max(0, 1 - maxEdge / linkDist);

              const facetAlpha = Math.max(
                0.02,
                Math.min(maxFacetAlpha, maxFacetAlpha * (0.45 + avgDepth * 0.75) * (0.45 + edgeFade * 0.55))
              );

              const grad = ctx.createLinearGradient(a.sx, a.sy, (b.sx + c.sx) * 0.5, (b.sy + c.sy) * 0.5);
              grad.addColorStop(0, rgbaStr(a.rgb, facetAlpha));
              grad.addColorStop(0.5, rgbaStr(b.rgb, facetAlpha * 0.85));
              grad.addColorStop(1, rgbaStr(c.rgb, facetAlpha * 0.65));

              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.moveTo(a.sx, a.sy);
              ctx.lineTo(b.sx, b.sy);
              ctx.lineTo(c.sx, c.sy);
              ctx.closePath();
              ctx.fill();
              drawnFacets++;
            }
          }
        }
      }

      // 3b. Connecting Luminous Plexus Lines
      ctx.lineWidth = 0.85;
      for (let i = 0; i < count; i++) {
        const a = projected[i];
        const nbrs = neighbors[i];
        for (let ni = 0; ni < nbrs.length; ni++) {
          const b = projected[nbrs[ni]];
          const dist = Math.hypot(a.sx - b.sx, a.sy - b.sy);
          const distFade = Math.max(0, 1 - dist / linkDist);
          const depthFade = 0.28 + ((a.depthFactor + b.depthFactor) * 0.5) * 0.72;
          const lineAlpha = distFade * depthFade * 0.52;

          const lineGrad = ctx.createLinearGradient(a.sx, a.sy, b.sx, b.sy);
          lineGrad.addColorStop(0, rgbaStr(a.rgb, lineAlpha));
          lineGrad.addColorStop(1, rgbaStr(b.rgb, lineAlpha));

          ctx.strokeStyle = lineGrad;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      // 4. Cursor Virtual Node Connections & Cursor-Anchored Facets (180px Radius)
      if (pointerActive) {
        const cursorNearby: { node: ProjectedNode; dist: number }[] = [];
        const cursorRgb = sampleCycledColor(palette, colorPhase + 0.45);

        for (let i = 0; i < count; i++) {
          const p = projected[i];
          const dist = Math.hypot(p.sx - pointerX, p.sy - pointerY);
          if (dist < cursorRadius) {
            cursorNearby.push({ node: p, dist });
          }
        }

        // Translucent facets anchored at invisible cursor node
        const cursorLimit = Math.min(cursorNearby.length, 14);
        for (let i = 0; i < cursorLimit; i++) {
          const na = cursorNearby[i].node;
          for (let j = i + 1; j < cursorLimit; j++) {
            const nb = cursorNearby[j].node;
            const pairDist = Math.hypot(na.sx - nb.sx, na.sy - nb.sy);
            if (pairDist < linkDist * 1.15) {
              const cursorFacetAlpha =
                maxFacetAlpha *
                Math.min(1, 1 - Math.max(cursorNearby[i].dist, cursorNearby[j].dist) / cursorRadius);
              const triGrad = ctx.createLinearGradient(pointerX, pointerY, na.sx, na.sy);
              triGrad.addColorStop(0, rgbaStr(cursorRgb, cursorFacetAlpha * 0.95));
              triGrad.addColorStop(1, rgbaStr(nb.rgb, cursorFacetAlpha * 0.55));
              ctx.fillStyle = triGrad;
              ctx.beginPath();
              ctx.moveTo(pointerX, pointerY);
              ctx.lineTo(na.sx, na.sy);
              ctx.lineTo(nb.sx, nb.sy);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // Luminous lines connecting cursor to nearby particles
        ctx.lineWidth = 1.05;
        for (let i = 0; i < cursorNearby.length; i++) {
          const { node: p, dist } = cursorNearby[i];
          const alpha = (1 - dist / cursorRadius) * 0.65;
          const cGrad = ctx.createLinearGradient(pointerX, pointerY, p.sx, p.sy);
          cGrad.addColorStop(0, rgbaStr(cursorRgb, alpha));
          cGrad.addColorStop(1, rgbaStr(p.rgb, alpha * 0.8));
          ctx.strokeStyle = cGrad;
          ctx.beginPath();
          ctx.moveTo(pointerX, pointerY);
          ctx.lineTo(p.sx, p.sy);
          ctx.stroke();
        }
      }

      // 5. Render Glowing Plexus Nodes (Back-to-Front Soft Depth Halo + Crisp Core)
      projected.sort((a, b) => b.z - a.z);

      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];

        // Outer soft depth-of-field halo
        const haloGrad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, p.blurGlow);
        haloGrad.addColorStop(0, rgbaStr(p.rgb, p.alpha * 0.52));
        haloGrad.addColorStop(0.45, rgbaStr(p.rgb, p.alpha * 0.16));
        haloGrad.addColorStop(1, rgbaStr(p.rgb, 0));

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.blurGlow, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright node core
        ctx.fillStyle = rgbaStr(
          {
            r: Math.min(255, p.rgb.r + 75),
            g: Math.min(255, p.rgb.g + 75),
            b: Math.min(255, p.rgb.b + 75)
          },
          Math.min(1, p.alpha * 1.1)
        );
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const startLoop = () => {
      if (animFrameId !== null) return;
      lastTimestamp = performance.now();
      animFrameId = window.requestAnimationFrame(renderFrame);
    };

    const stopLoop = () => {
      if (animFrameId !== null) {
        window.cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        startLoop();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    startLoop();

    return () => {
      stopLoop();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none"
    />
  );
};
