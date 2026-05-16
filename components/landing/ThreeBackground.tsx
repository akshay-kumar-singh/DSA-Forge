'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  active?: boolean;
}

export default function ThreeBackground({ active = true }: ThreeBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current || !active) return;

    const el = mountRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // ── Scene / Camera ─────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.z = 6;

    // ── Wireframe Icosahedron (blue) ───────────────────
    const icoGeo = new THREE.IcosahedronGeometry(1.8, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(-2.5, 0.5, -1);
    scene.add(ico);

    // ── Wireframe Octahedron (red accent) ─────────────
    const octGeo = new THREE.OctahedronGeometry(1.0, 0);
    const octMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const oct = new THREE.Mesh(octGeo, octMat);
    oct.position.set(3, -1.2, -2);
    scene.add(oct);

    // ── Torus (subtle, far back) ───────────────────────
    const torusGeo = new THREE.TorusGeometry(1.2, 0.04, 8, 40);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.08,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.set(1.5, 1.5, -3);
    scene.add(torus);

    // ── Particle Grid ─────────────────────────────────
    const COUNT = 180;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
    });
    const particles = new THREE.Points(ptGeo, ptMat);
    scene.add(particles);

    // ── Animation Loop ─────────────────────────────────
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      ico.rotation.x += 0.0015;
      ico.rotation.y += 0.002;
      oct.rotation.x -= 0.002;
      oct.rotation.y += 0.0025;
      torus.rotation.z += 0.001;
      torus.rotation.x += 0.0005;
      particles.rotation.y += 0.0003;
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize Handler ─────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
      icoGeo.dispose(); icoMat.dispose();
      octGeo.dispose(); octMat.dispose();
      torusGeo.dispose(); torusMat.dispose();
      ptGeo.dispose(); ptMat.dispose();
    };
  }, [active]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 0.5s ease' }}
    />
  );
}
