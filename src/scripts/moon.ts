/**
 * Three.js moon — lazy-loaded only when the moon container enters the viewport.
 * Dynamic import keeps three.js out of the initial bundle (~150 KB saved on first paint).
 */

export function initMoon(container: HTMLElement, stageEl: HTMLElement) {
  let started = false;

  const start = async () => {
    if (started) return;
    started = true;

    // Dynamic import — Three.js + GLTFLoader load only now, after the user scrolls near.
    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    function fit() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    fit();
    window.addEventListener('resize', fit);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff8e7, 4.5);
    sun.position.set(1, 1.5, 4);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2030, 0.6));
    const rim = new THREE.DirectionalLight(0x5bbae6, 0.45);
    rim.position.set(-3, 0.2, -2);
    scene.add(rim);

    const SETTINGS = {
      bright: {
        sunPos: new THREE.Vector3(1, 1.5, 4),
        sunIntensity: 4.5,
        ambient: 1.4,
        emissive: 0.55,
        rotationY: 0,
      },
      dark: {
        sunPos: new THREE.Vector3(4, 1.5, -3),
        sunIntensity: 1.4,
        ambient: 0.05,
        emissive: 0,
        rotationY: Math.PI,
      },
    };

    let moon: THREE.Object3D | null = null;
    const moonMeshes: THREE.Mesh[] = [];
    let target = SETTINGS.bright;
    let currentY = 0;

    const loader = new GLTFLoader();
    loader.load(
      // Assets in /public are served from the site root, respecting Astro's `base`.
      `${import.meta.env.BASE_URL.replace(/\/$/, '')}/assets/moon.glb`,
      (gltf) => {
        moon = gltf.scene;
        const box = new THREE.Box3().setFromObject(moon);
        const size = box.getSize(new THREE.Vector3()).length();
        const scale = 3.7 / size;
        moon.scale.setScalar(scale);
        const center = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
        moon.position.sub(center);
        moon.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            const map = mat.map;
            if (map) {
              mat.emissiveMap = map;
              mat.emissive = new THREE.Color(0xffffff);
              mat.emissiveIntensity = 0.45;
            }
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
            moonMeshes.push(mesh);
          }
        });
        scene.add(moon);
      },
      undefined,
      (err) => console.warn('moon.glb failed to load:', err),
    );

    let running = false;
    let inView = true;
    function tick() {
      if (!running) return;
      requestAnimationFrame(tick);
      target = stageEl.classList.contains('is-dark') ? SETTINGS.dark : SETTINGS.bright;
      sun.position.lerp(target.sunPos, 0.14);
      sun.intensity += (target.sunIntensity - sun.intensity) * 0.14;
      ambient.intensity += (target.ambient - ambient.intensity) * 0.14;
      if (moon) {
        currentY += (target.rotationY - currentY) * 0.14;
        moon.rotation.y = currentY;
        for (let i = 0; i < moonMeshes.length; i++) {
          const m = moonMeshes[i].material as THREE.MeshStandardMaterial;
          m.emissiveIntensity += (target.emissive - m.emissiveIntensity) * 0.14;
        }
      }
      renderer.render(scene, camera);
    }
    const startTick = () => {
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    };
    const stopTick = () => {
      running = false;
    };
    startTick();

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            inView = e.isIntersecting;
            if (inView && !document.hidden) startTick();
            else stopTick();
          });
        },
        { rootMargin: '100px' },
      );
      obs.observe(stageEl);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTick();
      else if (inView) startTick();
    });
  };

  // Wrap the heavy work in idle callbacks so Three.js parsing (~150 KB script
  // + 3 MB GLB) never competes with the initial paint. The browser fires
  // start() only when the main thread has a free chunk.
  const idle: (cb: () => void) => void =
    (window as any).requestIdleCallback?.bind(window) ||
    ((cb: () => void) => setTimeout(cb, 200));

  const scheduleStart = () => idle(() => start());

  if ('IntersectionObserver' in window) {
    const trigger = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trigger.disconnect();
          scheduleStart();
        }
      },
      // Tighter — only load when the moon is actually visible (no 300px pre-load buffer).
      // On Lighthouse mobile the moon is below the fold; this keeps Three.js off the
      // critical path entirely.
      { rootMargin: '0px' },
    );
    trigger.observe(container);
  } else {
    scheduleStart();
  }
}
