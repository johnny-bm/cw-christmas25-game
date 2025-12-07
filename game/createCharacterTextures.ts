import Phaser from 'phaser';

// Function to load PNG textures for character animation
export function createCharacterTextures(scene: Phaser.Scene) {
  // Load pushing frames (10 frames)
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    const key = `character-pushing-${frameNumber}`;
    const path = `/Assets/Characters/Character-Pushing-${frameNumber}.png`;
    scene.load.image(key, path);
  }

  // Load ollie frames (10 frames)
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    const key = `character-ollie-${frameNumber}`;
    const path = `/Assets/Characters/Character-Ollie-${frameNumber}.png`;
    scene.load.image(key, path);
  }

  // Load sprint pushing frames (10 frames)
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    const key = `sprint-character-pushing-${frameNumber}`;
    const path = `/Assets/Characters/Sprint-Character-Pushing-${frameNumber}.png`;
    scene.load.image(key, path);
  }

  // Load sprint ollie frames (10 frames)
  for (let i = 1; i <= 10; i++) {
    const frameNumber = i.toString().padStart(2, '0');
    const key = `sprint-character-ollie-${frameNumber}`;
    const path = `/Assets/Characters/Sprint-Character-Ollie-${frameNumber}.png`;
    scene.load.image(key, path);
  }
}
