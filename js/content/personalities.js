// Personality archetypes. Each drives chat frequency, emoji use, Hinglish mix,
// play style (AI weights), think time, rematch appetite and bio lines.

export const ARCHETYPES = {
  competitive: {
    label: 'Competitive', tag: '🔥 Aggressive', emojis: ['🔥', '😏', '💪', '👀'], chat: 0.75, hinglish: 0.35, emojiRate: 0.6,
    style: { aggression: 1.5, safety: 0.7, progress: 1, risk: 0.8, noise: 0.15 }, think: [650, 1100], rematch: 0.95,
    bios: ["Don't leave your token outside 😏", 'I play to win. Always.', 'Losing is not in my vocabulary 🔥', 'Your tokens look nervous.'],
  },
  playful: {
    label: 'Playful', tag: '😜 Playful', emojis: ['😂', '😜', '🙈', '✨'], chat: 0.7, hinglish: 0.5, emojiRate: 0.8,
    style: { aggression: 1.1, safety: 0.8, progress: 0.9, risk: 0.7, noise: 0.45 }, think: [600, 1200], rematch: 0.85,
    bios: ['Here for chaos and sixes 😜', 'Dice ka mood dekh ke khelti hoon 😂', 'Fun first, win second… maybe.'],
  },
  quiet: {
    label: 'Quiet', tag: '🌙 Quiet', emojis: ['🙂', '🌙'], chat: 0.15, hinglish: 0.2, emojiRate: 0.2,
    style: { aggression: 0.9, safety: 1.2, progress: 1.1, risk: 0.3, noise: 0.15 }, think: [900, 1500], rematch: 0.7,
    bios: ['…', 'Let the dice talk.', 'Quiet moves, loud wins.'],
  },
  funny: {
    label: 'Funny', tag: '🤣 Funny', emojis: ['🤣', '😭', '💀', '🤡'], chat: 0.8, hinglish: 0.55, emojiRate: 0.9,
    style: { aggression: 1, safety: 0.8, progress: 0.9, risk: 0.8, noise: 0.5 }, think: [500, 1100], rematch: 0.85,
    bios: ['My tokens have trust issues 😭', 'Professional six-misser 💀', 'Ludo is my cardio.'],
  },
  confident: {
    label: 'Confident', tag: '👑 Confident', emojis: ['👑', '😌', '💅'], chat: 0.5, hinglish: 0.3, emojiRate: 0.6,
    style: { aggression: 1.2, safety: 0.9, progress: 1.1, risk: 0.6, noise: 0.15 }, think: [600, 1000], rematch: 0.9,
    bios: ['Queen of the board 👑', 'Already planned my win.', 'Sit back, watch and learn 😌'],
  },
  beginner: {
    label: 'Beginner', tag: '🌱 Learning', emojis: ['😅', '🙏', '😊'], chat: 0.45, hinglish: 0.4, emojiRate: 0.6,
    style: { aggression: 0.8, safety: 0.6, progress: 0.8, risk: 0.6, noise: 0.95 }, think: [1000, 1700], rematch: 0.8,
    bios: ['New here, be nice 😅', 'Still figuring out the safe squares.', 'Learning one roll at a time 🌱'],
  },
  expert: {
    label: 'Expert', tag: '🎯 Expert', emojis: ['🎯', '👌'], chat: 0.3, hinglish: 0.15, emojiRate: 0.3,
    style: { aggression: 1.2, safety: 1.3, progress: 1.2, risk: 0.3, noise: 0.05 }, think: [700, 1100], rematch: 0.85,
    bios: ['Every move matters.', '2,000+ games. Still learning.', 'Patience wins the board 🎯'],
  },
  strategic: {
    label: 'Strategist', tag: '♟️ Strategist', emojis: ['🧠', '♟️', '👀'], chat: 0.35, hinglish: 0.2, emojiRate: 0.35,
    style: { aggression: 1.1, safety: 1.4, progress: 1.1, risk: 0.2, noise: 0.08 }, think: [1000, 1500], rematch: 0.8,
    bios: ['Every move matters.', 'Three moves ahead 🧠', 'Safe squares are my best friends.'],
  },
  lucky: {
    label: 'Lucky', tag: '🍀 Lucky', emojis: ['🍀', '✨', '🎲'], chat: 0.55, hinglish: 0.45, emojiRate: 0.7,
    style: { aggression: 1, safety: 0.8, progress: 1, risk: 0.9, noise: 0.4 }, think: [500, 900], rematch: 0.85,
    bios: ['Sixes just like me 🍀', 'Luck is a skill. Fight me.', 'Blow on the dice ✨'],
  },
  risky: {
    label: 'Risk-taker', tag: '⚡ Risk-taker', emojis: ['⚡', '😈', '🔥'], chat: 0.6, hinglish: 0.4, emojiRate: 0.7,
    style: { aggression: 1.5, safety: 0.4, progress: 1.2, risk: 1.2, noise: 0.25 }, think: [450, 800], rematch: 0.9,
    bios: ['All tokens out. Always ⚡', 'Safe squares are for cowards 😈', 'Go big or go yard.'],
  },
  defensive: {
    label: 'Defensive', tag: '🛡️ Defensive', emojis: ['🛡️', '😌'], chat: 0.35, hinglish: 0.3, emojiRate: 0.4,
    style: { aggression: 0.6, safety: 1.6, progress: 1, risk: 0.1, noise: 0.15 }, think: [900, 1400], rematch: 0.75,
    bios: ['Slow and steady 🛡️', 'Catch me if you can.', 'My tokens never get cut.'],
  },
  friendly: {
    label: 'Friendly', tag: '😊 Chill', emojis: ['😊', '✨', '👋', '💛'], chat: 0.6, hinglish: 0.4, emojiRate: 0.7,
    style: { aggression: 0.8, safety: 1, progress: 1, risk: 0.5, noise: 0.35 }, think: [700, 1200], rematch: 0.85,
    bios: ['Here for good games ✨', 'GG always 😊', 'Make friends, roll dice.'],
  },
  sarcastic: {
    label: 'Sarcastic', tag: '🙃 Sarcastic', emojis: ['🙃', '😒', '👏'], chat: 0.65, hinglish: 0.45, emojiRate: 0.55,
    style: { aggression: 1.2, safety: 0.9, progress: 1, risk: 0.6, noise: 0.25 }, think: [600, 1000], rematch: 0.85,
    bios: ['Wow, another six. Shocking 🙃', 'I’m not competitive. You are.', 'Nice try though 👏'],
  },
  emoji: {
    label: 'Emoji Queen', tag: '🥳 Expressive', emojis: ['🥳', '😍', '🤩', '💃', '🎉'], chat: 0.75, hinglish: 0.3, emojiRate: 1,
    style: { aggression: 1, safety: 0.9, progress: 1, risk: 0.6, noise: 0.4 }, think: [500, 1000], rematch: 0.85,
    bios: ['🎲✨💃🎉', 'Speaking fluent emoji 🤩', 'Vibes > wins 🥳'],
  },
  minimal: {
    label: 'Minimal', tag: '▫️ Minimal', emojis: ['👍'], chat: 0.2, hinglish: 0.1, emojiRate: 0.1,
    style: { aggression: 1, safety: 1.1, progress: 1.1, risk: 0.4, noise: 0.12 }, think: [700, 1100], rematch: 0.8,
    bios: ['gg.', 'Play.', 'Less talk.'],
  },
  talkative: {
    label: 'Talkative', tag: '💬 Talkative', emojis: ['😄', '👀', '😱', '🙌'], chat: 0.95, hinglish: 0.5, emojiRate: 0.6,
    style: { aggression: 1, safety: 0.9, progress: 1, risk: 0.6, noise: 0.35 }, think: [600, 1100], rematch: 0.9,
    bios: ['Will comment on every move 😄', 'Ludo + gossip = perfect evening', 'Talk to me while I win 🙌'],
  },
  rematch: {
    label: 'Rematch Addict', tag: '🔁 Rematch Addict', emojis: ['🔁', '😤', '😏'], chat: 0.6, hinglish: 0.45, emojiRate: 0.6,
    style: { aggression: 1.2, safety: 0.9, progress: 1, risk: 0.7, noise: 0.25 }, think: [550, 950], rematch: 1,
    bios: ['One more? Always one more 🔁', 'Best of 3? Best of 7.', 'Rematch pakka 😤'],
  },
  calm: {
    label: 'Calm', tag: '🍃 Calm', emojis: ['🍃', '😌', '🙂'], chat: 0.35, hinglish: 0.3, emojiRate: 0.45,
    style: { aggression: 0.8, safety: 1.2, progress: 1.1, risk: 0.3, noise: 0.2 }, think: [900, 1400], rematch: 0.8,
    bios: ['No stress, just dice 🍃', 'Win or lose, chai after.', 'Deep breaths. Roll.'],
  },
  fast: {
    label: 'Speedster', tag: '⚡ Fast Player', emojis: ['⚡', '🏃‍♀️', '😝'], chat: 0.45, hinglish: 0.4, emojiRate: 0.6,
    style: { aggression: 1.2, safety: 0.7, progress: 1.2, risk: 0.8, noise: 0.35 }, think: [300, 550], rematch: 0.9,
    bios: ['Blink and I’ve moved ⚡', 'Thinking is overrated 😝', 'Quick games only.'],
  },
  slow: {
    label: 'Slow Thinker', tag: '🤔 Thinker', emojis: ['🤔', '🧐'], chat: 0.3, hinglish: 0.35, emojiRate: 0.4,
    style: { aggression: 1, safety: 1.3, progress: 1.1, risk: 0.3, noise: 0.08 }, think: [1400, 2100], rematch: 0.75,
    bios: ['Let me think… 🤔', 'Patience is a weapon.', 'I calculate. Every. Move.'],
  },
  challenger: {
    label: 'Challenge Seeker', tag: '🏆 Challenger', emojis: ['🏆', '😤', '🔥'], chat: 0.55, hinglish: 0.35, emojiRate: 0.55,
    style: { aggression: 1.3, safety: 0.9, progress: 1.1, risk: 0.7, noise: 0.15 }, think: [600, 1000], rematch: 0.95,
    bios: ['Only play the best 🏆', 'Challenge me. I dare you.', 'Climbing to Legend.'],
  },
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);

/* ---------- Message pools ---------- */
// Short, spontaneous, game-related. Keys map to match events.
// Each entry: [english, hinglish] — the speaker's hinglish ratio picks one.
const POOLS = {
  greet: [['Good luck 👀', 'All the best 👀'], ['Ready?', 'Chalo shuru karein?'], ['Let’s go!', 'Chalo!'], ['Hi! GL', 'Hi! GL'], ['Game on 🎲', 'Game on 🎲'], ['Be nice to me 😅', 'Thoda dhire khelna 😅']],
  meSix: [['Six! 😎', 'Chhakka! 😎'], ['Lucky me ✨', 'Kya roll hai ✨'], ['There it is', 'Yeh hui na baat'], ['Again?!', 'Phir se?!']],
  youSix: [['Six again?? 😂', 'Phir se six?? 😂'], ['You’re lucky today.', 'Aaj luck tumhare saath hai.'], ['Okay okay 😭', 'Achha achha 😭'], ['How?!', 'Kaise?!'], ['Stop rolling sixes 😤', 'Bas karo sixes 😤']],
  iCaptured: [['Bye bye token 👋', 'Bye bye token 👋'], ['Sorry not sorry 😏', 'Sorry not sorry 😏'], ['Oops 😇', 'Oops 😇'], ['That had to happen', 'Yeh toh hona hi tha'], ['Back home you go', 'Ghar jao 😂']],
  gotCaptured: [['Ouch.', 'Ouch.'], ['Arre yaar 😭', 'Arre yaar 😭'], ['Really?? 😤', 'Sach mein?? 😤'], ['You’ll pay for that', 'Ab dekhna 😏'], ['Revenge loading…', 'Badla lungi 😤'], ['Rude 😂', 'Rude 😂']],
  meNearHome: [['Almost there 👀', 'Bas thoda aur 👀'], ['One more move…', 'Ek aur move…'], ['Can you stop me?', 'Rok sako toh rok lo 😏']],
  youNearHome: [['Don’t you dare', 'Khabardaar 😤'], ['That was close.', 'Bahut close tha.'], ['Nooo not yet', 'Abhi nahi yaar'], ['Pressure is on 😱', 'Pressure hai 😱']],
  meHome: [['One home 🏠', 'Ek ghar pahunch gaya 🏠'], ['Safe and sound', 'Safe ✨'], ['Next!', 'Agla!']],
  goodMove: [['Nice move 😂', 'Achha move tha 😂'], ['Good move.', 'Badhiya.'], ['Smart.', 'Smart ho tum.'], ['Didn’t see that coming', 'Yeh nahi socha tha']],
  meWin: [['GG! 😎', 'GG! 😎'], ['Well played!', 'Achha khela!'], ['Too easy 😏', 'Bahut easy tha 😏'], ['That was fun ✨', 'Maza aaya ✨']],
  meLose: [['GG! You earned it', 'GG! Tum jeet gaye'], ['Rematch?', 'Rematch?'], ['I’m not losing twice 😏', 'Agli baar nahi 😏'], ['Well played!', 'Achha khela!'], ['Ugh, so close 😭', 'Itna close 😭']],
  rematchAsk: [['Rematch? 😏', 'Rematch? 😏'], ['One more?', 'Ek aur?'], ['Again. Now.', 'Phir se. Abhi.'], ['Rematch pakka.', 'Rematch pakka.']],
  rematchYes: [['Let’s go again 🔥', 'Chalo phir se 🔥'], ['Round 2!', 'Round 2!'], ['You’re on.', 'Done!']],
  rematchNo: [['Gotta go, GG ✨', 'Jaana hai, GG ✨'], ['Next time!', 'Agli baar!'], ['Later! GG', 'Baad mein! GG']],
  idle: [['Your turn 👀', 'Tumhari baari 👀'], ['Thinking hard? 🤔', 'Soch rahe ho? 🤔']],
  reply: [['Haha 😂', 'Haha 😂'], ['True', 'Sahi'], ['😏', '😏'], ['We’ll see', 'Dekhte hain'], ['Focus on the game 😂', 'Game pe dhyan do 😂'], ['Okay okay', 'Achha theek hai'], ['Lol', 'Lol'], ['You wish 😌', 'Sapne mein 😌']],
  invite: [['Up for a game?', 'Ek game?'], ['I challenge you 🎲', 'Challenge hai 🎲'], ['Bored. Ludo?', 'Bore ho rahi hoon. Ludo?'], ['Rematch? 😏', 'Rematch? 😏']],
};

// Named hero lines that override pools for the hand-tuned characters.
export const HERO_LINES = {
  riya: { youSix: ['Six again?? 😂', 'Ye kya roll tha 😂'], gotCaptured: ['Ab dekhna 😏', 'Okay that’s war 🔥'], meWin: ['Told you 😏🔥'], rematchAsk: ['Rematch? 😏'] },
  meera: { greet: ['Hii! Good luck ✨'], meLose: ['GG ✨ that was lovely'], goodMove: ['Ooh nice 😊'] },
  tanya: { greet: ['GL.'], goodMove: ['Nice.', 'Good move.'], meLose: ['GG. Again?'], rematchAsk: ['Again?'], meWin: ['GG.'] },
  ananya: { youSix: ['Wait WHAT 😱 another six?', 'Okay you’re on fire today'], gotCaptured: ['Noooo my token 😭 it was so close'], meNearHome: ['Look look, almost home 🙌'] },
  kavya: { meWin: ['gg.'], meLose: ['well played.'], goodMove: ['hm. nice.'] },
};

export function line(char, key, rnd = Math.random) {
  const hero = HERO_LINES[char.heroKey]?.[key];
  if (hero && rnd() < 0.75) return hero[Math.floor(rnd() * hero.length)];
  const pool = POOLS[key];
  if (!pool) return null;
  const a = ARCHETYPES[char.archetype];
  const [en, hi] = pool[Math.floor(rnd() * pool.length)];
  let text = rnd() < a.hinglish ? hi : en;
  if (!/\p{Extended_Pictographic}/u.test(text) && rnd() < a.emojiRate * 0.6) {
    text += ` ${a.emojis[Math.floor(rnd() * a.emojis.length)]}`;
  }
  if (char.archetype === 'minimal' || char.archetype === 'quiet') text = text.replace(/\s*\p{Extended_Pictographic}.*$/u, '').toLowerCase() || text;
  return text;
}

export const QUICK_REPLIES = ['GG!', 'Good luck 👀', 'Nice move 😂', 'Ouch.', 'Rematch?', 'Well played!', 'Arre yaar 😭', 'Ab dekhna 😏'];
export const REACTIONS = ['😂', '🔥', '😏', '👏', '😱', '❤️', '😭', '👑'];
