export type Answers = {
  players?: string;
  group?: string;
  youngest?: string;
  time?: string;
  mood?: string;
  interaction?: string;
  interests?: string[];
  learning?: string;
};

export type Option = { value: string; label: string; emoji: string; hint?: string };
export type Question = {
  key: keyof Answers;
  title: string;
  multi?: number;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  { key: "players", title: "How many people are playing?", options: [
    { value: "2", label: "2", emoji: "👫" },
    { value: "3-4", label: "3–4", emoji: "👨‍👩‍👧" },
    { value: "5-6", label: "5–6", emoji: "🧑‍🤝‍🧑" },
    { value: "7-8", label: "7–8", emoji: "🎉" },
    { value: "9+", label: "9+", emoji: "🏟️" },
  ]},
  { key: "group", title: "Who’s at the table today?", options: [
    { value: "adults", label: "Adults", emoji: "☕" },
    { value: "teens", label: "Friends and teens", emoji: "🎧" },
    { value: "family", label: "Family with children", emoji: "🏡" },
    { value: "kids", label: "Mostly children", emoji: "🧸" },
    { value: "mixed", label: "A mixed-age group", emoji: "🌈" },
  ]},
  { key: "youngest", title: "How old is the youngest player?", options: [
    { value: "4", label: "Under 6", emoji: "🍼" },
    { value: "6", label: "6–7", emoji: "🪁" },
    { value: "8", label: "8–9", emoji: "🧩" },
    { value: "10", label: "10–12", emoji: "🚲" },
    { value: "13", label: "13–17", emoji: "🎒" },
    { value: "18", label: "Everyone is 18+", emoji: "🧑" },
  ]},
  { key: "time", title: "How long do you want to play?", options: [
    { value: "10", label: "Under 15 minutes", emoji: "⚡" },
    { value: "25", label: "15–30 minutes", emoji: "⏱️" },
    { value: "45", label: "30–60 minutes", emoji: "🕐" },
    { value: "75", label: "60–90 minutes", emoji: "🕜" },
    { value: "120", label: "90+ minutes", emoji: "🌙" },
  ]},
  { key: "mood", title: "What kind of experience sounds fun today?", options: [
    { value: "silly", label: "Laugh and be silly", emoji: "😂" },
    { value: "relax", label: "Relax and chat", emoji: "🍵" },
    { value: "compete", label: "Get competitive", emoji: "🏆" },
    { value: "think", label: "Think and strategize", emoji: "🧠" },
    { value: "mystery", label: "Solve a mystery together", emoji: "🔍" },
    { value: "energetic", label: "Try something energetic", emoji: "⚡" },
  ]},
  { key: "interaction", title: "How do you want to play together?", options: [
    { value: "coop", label: "Team up", emoji: "🤝", hint: "Everyone works together to win as one group." },
    { value: "solo", label: "Everyone for themselves", emoji: "🥇", hint: "Each person tries to finish first or score the most points." },
    { value: "teams", label: "Small teams", emoji: "🆚", hint: "Players split into pairs or groups and compete against the other teams." },
    { value: "bluff", label: "Tricks and surprises", emoji: "🎭", hint: "You can hide information, bluff, or catch other players off guard." },
    { value: "friendly", label: "Easy and friendly", emoji: "😊", hint: "The game stays light, with less pressure and more conversation." },
    { value: "any", label: "Anything is fine", emoji: "✨", hint: "You are open to whichever style suits the group." },
  ]},
  { key: "interests", title: "What catches your attention?", multi: 2, options: [
    { value: "words", label: "Words and trivia", emoji: "🔤" },
    { value: "mystery", label: "Mystery and deduction", emoji: "🕵️" },
    { value: "strategy", label: "Strategy and building", emoji: "🏰" },
    { value: "cards", label: "Fast cards and lucky moments", emoji: "🃏" },
    { value: "creative", label: "Drawing and creativity", emoji: "🎨" },
    { value: "dexterity", label: "Dexterity and physical challenges", emoji: "🤹" },
    { value: "adventure", label: "Adventure, fantasy, or nature", emoji: "🌿" },
    { value: "classic", label: "Classic and abstract games", emoji: "♟️" },
  ]},
  { key: "learning", title: "How much explanation are you comfortable with?", options: [
    { value: "1", label: "Start almost immediately", emoji: "🚀" },
    { value: "2", label: "A short explanation is fine", emoji: "💬" },
    { value: "3", label: "We’re happy to learn something deeper", emoji: "📚" },
  ]},
];
