import type { Novel, Chapter } from './types';

const mockNovels: Novel[] = [
  {
    id: 'the-misty-mountains',
    title: 'The Misty Mountains Echo',
    author: 'Elara Vance',
    coverImage: 'https://placehold.co/300x450.png?text=Misty+Mountains',
    summary: 'A thrilling adventure into the heart of the legendary Misty Mountains, where ancient secrets and formidable challenges await the brave.',
    githubRepoUrl: 'https://github.com/example/repo/tree/main/the-misty-mountains',
    chapters: [
      { id: 'chapter-1', title: 'The Unexpected Journey', order: 1, content: '<p>The wind howled a mournful tune around the jagged peaks of the Dragon’s Tooth pass. Anya, wrapped in a thick fur cloak, squinted against the stinging snow. It had been three days since she left the village of Oakhaven, her heart a leaden weight in her chest. The village elder’s words still echoed in her mind: "The mountain calls for a sacrifice, child. Only the purest heart can appease its ancient slumber."</p><p>Anya clutched the small, intricately carved wooden bird in her mittened hand. It was a gift from her younger brother, Finn, his innocent eyes wide with a mixture of fear and hope when she’d said goodbye. "Come back safe, Anya," he’d whispered, his voice trembling. The memory fueled her resolve. She would not fail.</p><p>The path, if one could call it that, was treacherous. Loose scree and hidden ice patches made every step a gamble. Below, the valley was a sea of swirling mist, Oakhaven lost to its ethereal embrace. Anya was alone, with only the biting wind and the silent, imposing mountains as her companions. The air thinned with every upward step, and a dull ache began to throb behind her temples. Yet, she pressed on, driven by a desperate hope and the weight of her village’s survival.</p>' },
      { id: 'chapter-2', title: 'Whispers in the Ice', order: 2, content: '<p>Dusk painted the snow-capped peaks in hues of violet and blood orange as Anya found a shallow cave, barely large enough to offer respite from the relentless wind. She huddled inside, pulling her cloak tighter. The temperature plummeted with the setting sun, and the silence of the mountains became profound, broken only by the occasional crackle of shifting ice far above.</p><p>As she gnawed on a piece of dried meat, a strange sound reached her ears – a faint, almost inaudible whisper. It seemed to emanate from the very ice and rock around her. Anya froze, her senses on high alert. The whispers were sibilant, formless, yet they carried an undeniable sense of ancient power and sorrow. Was this the mountain speaking? Or was her mind, starved of oxygen and companionship, playing tricks on her?</p><p>Fear, cold and sharp, pricked at her. She remembered the old tales, of spirits trapped within the mountain’s icy heart, of travelers lost to its chilling embrace. She tightened her grip on the wooden bird, its smooth surface a small comfort in the encroaching darkness. The whispers grew stronger, coiling around her like unseen tendrils. Sleep seemed a distant, impossible luxury.</p>' },
      { id: 'chapter-3', title: 'The Hidden Path', order: 3, content: '<p>The first rays of dawn found Anya weary but alive. The whispers had faded with the night, leaving behind an unsettling stillness. Determined to find the Sunstone Altar, the place of sacrifice spoken of by the elder, she ventured out of the cave. The landscape was a stark, beautiful desolation of white and grey.</p><p>Hours of fruitless searching followed. The maps she carried were crude, based on generations-old memories. Just as despair began to set in, she noticed it – a faint carving on a rock face, almost obscured by snow. It depicted a spiraling serpent, an ancient symbol of her people. Following the direction the serpent’s head pointed, she found a narrow crevice, hidden behind a curtain of icicles. It was a path, barely wide enough for a person to squeeze through.</p><p>With a deep breath, Anya entered the crevice. The air inside was still and heavy, the silence absolute. The passage twisted and turned, descending into the mountain’s depths. Light from the entrance soon faded, and she was forced to light her small oil lamp, its flickering flame casting dancing shadows on the rock walls. The path was a test of courage, a journey into the unknown, but Anya knew, with a certainty that settled deep in her bones, that she was on the right track.</p>' },
    ],
  },
  {
    id: 'chronicles-of-aetheria',
    title: 'Chronicles of Aetheria',
    author: 'Orion Pax',
    coverImage: 'https://placehold.co/300x450.png?text=Aetheria+Chronicles',
    summary: 'Explore the magical realm of Aetheria, a land of floating islands, mythical creatures, and a destiny waiting to be fulfilled.',
    chapters: [
      { id: 'chapter-1', title: 'The Sky-ship', order: 1, content: '<p>The Leviathan, a majestic sky-ship crafted from polished cloudwood and shimmering aether-crystals, glided silently through the endless expanse of the Azure Sea. On its deck stood Kael, a young apprentice cartographer, his eyes wide with wonder as he charted the ever-shifting currents of the wind. Aetheria was a world unlike any other, a tapestry of colossal islands suspended in the sky, each with its own unique ecosystem and inhabitants.</p><p>Captain Eva Rostova, a woman whose gaze held the wisdom of a thousand voyages, approached him. "See anything unusual, lad?" she asked, her voice a low rumble that always seemed to carry an undercurrent of adventure. Kael pointed towards a distant anomaly, a shimmering distortion in the air. "There, Captain. The Aetheric currents are… agitated. Like something big is disturbing them."</p><p>Eva nodded, her expression thoughtful. "The Oracle’s warnings… they might be coming true. Prepare the crew, Kael. We may be heading into uncharted territory, and perhaps, into danger." Kael’s heart thrummed with a mixture of excitement and trepidation. This was what he had always dreamed of – an adventure that would test his skills and courage to their limits.</p>' },
      { id: 'chapter-2', title: 'Island of Whispering Winds', order: 2, content: '<p>Following the disturbance, the Leviathan arrived at an uncharted island, wreathed in perpetual mist and echoing with the soft sighs of the wind. Locals called it the Island of Whispering Winds, a place of ancient magic and forgotten lore. As Kael and a small landing party disembarked, the air hummed with an almost palpable energy.</p><p>The flora was bioluminescent, casting an ethereal glow on the winding paths. Strange, melodious calls echoed from the dense, glowing forests. They soon discovered a hidden shrine, its stones covered in intricate carvings that depicted celestial beings and catastrophic events. At the center of the shrine, a pedestal held a single, pulsating crystal – the source of the island’s unique aura, and perhaps, the cause of the Aetheric disturbances.</p><p>Suddenly, shadowy figures emerged from the trees, their eyes glowing with an unnerving light. They were the island’s guardians, sworn to protect its secrets. A tense standoff ensued, their ancient language incomprehensible to Kael and his companions. The fate of their mission, and perhaps the balance of Aetheria itself, hung precariously in the balance.</p>' },
    ],
  },
];

// Helper to add data-ai-hint to placeholder URLs
function addAiHintToCover(coverImage: string, title: string): string {
  if (coverImage.includes('placehold.co')) {
    const titleHint = title.split(' ').slice(0, 2).join(' ').toLowerCase() || 'book';
    // Ensure we don't duplicate the data-ai-hint parameter
    if (coverImage.includes('data-ai-hint=')) {
      return coverImage; // Already has a hint, possibly from a previous call
    }
    const separator = coverImage.includes('?') ? '&' : '?';
    return `${coverImage}${separator}data-ai-hint=${encodeURIComponent(titleHint + " cover")}`;
  }
  return coverImage;
}


export async function fetchNovels(): Promise<Novel[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockNovels.map(novel => ({
        ...novel,
        coverImage: addAiHintToCover(novel.coverImage, novel.title)
      })));
    }, 500); 
  });
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  return new Promise(resolve => {
    setTimeout(() => {
      const novel = mockNovels.find(n => n.id === id);
      if (novel) {
        resolve({
          ...novel,
          coverImage: addAiHintToCover(novel.coverImage, novel.title)
        });
      } else {
        resolve(undefined);
      }
    }, 300);
  });
}

export async function fetchChapter(novelId: string, chapterId: string): Promise<{ novel: Novel; chapter: Chapter } | undefined> {
  return new Promise(resolve => {
    setTimeout(() => {
      const novel = mockNovels.find(n => n.id === novelId);
      if (novel) {
        const chapter = novel.chapters.find(c => c.id === chapterId);
        if (chapter) {
          resolve({ 
            novel: {
              ...novel,
              coverImage: addAiHintToCover(novel.coverImage, novel.title)
            }, 
            chapter 
          });
        } else {
          resolve(undefined);
        }
      } else {
        resolve(undefined);
      }
    }, 200);
  });
}

export async function checkForUpdates(novel: Novel): Promise<boolean> {
  console.log(`Checking for updates for ${novel.title} at ${novel.githubRepoUrl}`);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(Math.random() < 0.1);
    }, 1000);
  });
}
