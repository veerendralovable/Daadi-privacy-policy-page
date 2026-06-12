/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Shield, 
  FileText, 
  Mail, 
  ArrowUp, 
  Smartphone, 
  Play, 
  ChevronRight, 
  Info, 
  BookOpen, 
  HelpCircle, 
  Scale, 
  Users, 
  Zap, 
  Activity, 
  Timer, 
  RefreshCw,
  Award
} from 'lucide-react';

// Define board coordinates and topology for Nine Men's Morris (Daadi)
interface Point {
  id: number;
  x: number;
  y: number;
  label: string;
}

const BOARD_POINTS: Point[] = [
  // Outer Square (IDs 1-8)
  { id: 1, x: 50, y: 50, label: "Outer Top-Left" },
  { id: 2, x: 300, y: 50, label: "Outer Top-Mid" },
  { id: 3, x: 550, y: 50, label: "Outer Top-Right" },
  { id: 4, x: 550, y: 300, label: "Outer Mid-Right" },
  { id: 5, x: 550, y: 550, label: "Outer Bottom-Right" },
  { id: 6, x: 300, y: 550, label: "Outer Bottom-Mid" },
  { id: 7, x: 50, y: 550, label: "Outer Bottom-Left" },
  { id: 8, x: 50, y: 300, label: "Outer Mid-Left" },

  // Middle Square (IDs 9-16)
  { id: 9, x: 130, y: 130, label: "Middle Top-Left" },
  { id: 10, x: 300, y: 130, label: "Middle Top-Mid" },
  { id: 11, x: 470, y: 130, label: "Middle Top-Right" },
  { id: 12, x: 470, y: 300, label: "Middle Mid-Right" },
  { id: 13, x: 470, y: 470, label: "Middle Bottom-Right" },
  { id: 14, x: 300, y: 470, label: "Middle Bottom-Mid" },
  { id: 15, x: 130, y: 470, label: "Middle Bottom-Left" },
  { id: 16, x: 130, y: 300, label: "Middle Mid-Left" },

  // Inner Square (IDs 17-24)
  { id: 17, x: 210, y: 210, label: "Inner Top-Left" },
  { id: 18, x: 300, y: 210, label: "Inner Top-Mid" },
  { id: 19, x: 390, y: 210, label: "Inner Top-Right" },
  { id: 20, x: 390, y: 300, label: "Inner Mid-Right" },
  { id: 21, x: 390, y: 390, label: "Inner Bottom-Right" },
  { id: 22, x: 300, y: 390, label: "Inner Bottom-Mid" },
  { id: 23, x: 210, y: 390, label: "Inner Bottom-Left" },
  { id: 24, x: 210, y: 300, label: "Inner Mid-Left" }
];

// Graph adjacency list specifying the authentic valid moves between intersections
const ADJACENCY: Record<number, number[]> = {
  1: [2, 8],
  2: [1, 3, 10],
  3: [2, 4],
  4: [3, 5, 12],
  5: [4, 6],
  6: [5, 7, 14],
  7: [6, 8],
  8: [1, 7, 16],
  
  9: [10, 16],
  10: [9, 11, 2, 18],
  11: [10, 12],
  12: [11, 13, 4, 20],
  13: [12, 14],
  14: [13, 15, 6, 22],
  15: [14, 16],
  16: [9, 15, 8, 24],

  17: [18, 24],
  18: [17, 19, 10],
  19: [18, 20],
  20: [19, 21, 12],
  21: [20, 22],
  22: [21, 23, 14],
  23: [22, 24],
  24: [23, 17, 16]
};

// Check if three points form a mill / "Daadi"
const ALL_MILLS = [
  // Outer Square Horizontal & Vertical
  [1, 2, 3], [3, 4, 5], [5, 6, 7], [7, 8, 1],
  // Middle Square Horizontal & Vertical
  [9, 10, 11], [11, 12, 13], [13, 14, 15], [15, 16, 9],
  // Inner Square Horizontal & Vertical
  [17, 18, 19], [19, 20, 21], [21, 22, 23], [23, 24, 17],
  // Conjoined midpoints
  [2, 10, 18], [4, 12, 20], [6, 14, 22], [8, 16, 24]
];

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Active section tracker via intersection observer
  useEffect(() => {
    const handleScroll = () => {
      // Show back to top button
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Detect active section on screen
      const sections = ['home', 'game-interactive', 'rules-guide', 'privacy-policy', 'terms-of-service'];
      const current = sections.find(id => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Adjust threshold to spot section
          return rect.top <= 200 && rect.bottom >= 200;
        }
        return false;
      });
      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- INTERACTIVE DAADI DEMO STATES ---
  const [board, setBoard] = useState<Record<number, 'green' | 'gold' | null>>(() => {
    const initial: Record<number, 'green' | 'gold' | null> = {};
    for (let i = 1; i <= 24; i++) {
      // Let's seed the board with a few aesthetic initial tokens to let players immediately see how they align!
      if (i === 1) initial[i] = 'green';
      else if (i === 4) initial[i] = 'gold';
      else if (i === 5) initial[i] = 'green';
      else if (i === 12) initial[i] = 'gold';
      else if (i === 9) initial[i] = 'green';
      else initial[i] = null;
    }
    return initial;
  });

  const [phase, setPhase] = useState<'placing' | 'moving'>('placing');
  const [turn, setTurn] = useState<'green' | 'gold'>('green');
  
  // Placement counters
  const [greenToPlace, setGreenToPlace] = useState(6); // 3 placed in seed already to make 9 total
  const [goldToPlace, setGoldToPlace] = useState(7);  // 2 placed in seed already to make 9 total
  
  // Selection state for sliding phase
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const [soundEffectPlayed, setSoundEffectPlayed] = useState<string | null>(null);
  const [gameMessage, setGameMessage] = useState<string>("Align 3 pieces to form a 'Daadi'!");

  // Trigger brief visual feedback banner
  const triggerBannerAlert = (msg: string) => {
    setGameMessage(msg);
    setTimeout(() => {
      setGameMessage("Place or slide pieces to block your opponent!");
    }, 4500);
  };

  // Check if a placement or move resulted in a mill (Daadi)
  const checkMillState = (pointId: number, currentBoard: Record<number, 'green' | 'gold' | null>, player: 'green' | 'gold') => {
    // Find all mills containing this point
    const potentialMills = ALL_MILLS.filter(mill => mill.includes(pointId));
    for (const mill of potentialMills) {
      if (mill.every(id => currentBoard[id] === player)) {
        return true;
      }
    }
    return false;
  };

  const handlePointClick = (id: number) => {
    const currentOwner = board[id];

    // Phase 1: Placing Pieces
    if (phase === 'placing') {
      if (currentOwner !== null) {
        triggerBannerAlert("That intersection is already occupied!");
        return;
      }

      // Determine remaining placement count of current turn player
      const isGreenTurn = turn === 'green';
      const toPlace = isGreenTurn ? greenToPlace : goldToPlace;

      if (toPlace <= 0) {
        // Transition to moving phase if both runs are fully placed
        setPhase('moving');
        triggerBannerAlert("All pieces placed! Slide pieces along lines to adjacent spots.");
        return;
      }

      // Execute placement
      const nextBoard = { ...board, [id]: turn };
      setBoard(nextBoard);

      if (isGreenTurn) {
        setGreenToPlace(prev => prev - 1);
      } else {
        setGoldToPlace(prev => prev - 1);
      }

      // Play tactical audio note (simulated sound effect cue visually)
      setSoundEffectPlayed(`Placed a ${turn} piece on position ${id}`);

      // Check for Mill (Daadi)
      const didMill = checkMillState(id, nextBoard, turn);
      if (didMill) {
        triggerBannerAlert(`★ DAADI! ${turn.toUpperCase()} aligned 3 pieces successfully!`);
      }

      // Check if total pieces placed are depleted
      const nextGreenToPlace = isGreenTurn ? greenToPlace - 1 : greenToPlace;
      const nextGoldToPlace = !isGreenTurn ? goldToPlace - 1 : goldToPlace;
      
      if (nextGreenToPlace === 0 && nextGoldToPlace === 0) {
        setPhase('moving');
        setTurn(turn === 'green' ? 'gold' : 'green');
      } else {
        // Normal turn flip
        setTurn(turn === 'green' ? 'gold' : 'green');
      }
    } 
    // Phase 2: Sliding/Moving Pieces
    else {
      if (selectedPin === null) {
        // Trying to select one's own piece
        if (currentOwner !== turn) {
          triggerBannerAlert(`It is ${turn.toUpperCase()}'s turn! Select one of your active tokens.`);
          return;
        }
        setSelectedPin(id);
      } else {
        // Already selected, either click same to deselect, click another of own to change selection, or click empty adjacent to move
        if (id === selectedPin) {
          setSelectedPin(null);
          return;
        }

        if (currentOwner === turn) {
          setSelectedPin(id); // Shift selection
          return;
        }

        if (currentOwner !== null) {
          triggerBannerAlert("Cannot move to an occupied space!");
          return;
        }

        // Validate adjacency
        const validSpots = ADJACENCY[selectedPin] || [];
        if (!validSpots.includes(id)) {
          triggerBannerAlert("Pieces can only slide to adjacent spaces connected by lines!");
          return;
        }

        // Valid move
        const nextBoard = { ...board, [selectedPin]: null, [id]: turn };
        setBoard(nextBoard);
        setSelectedPin(null);
        setSoundEffectPlayed(`Slid piece from ${selectedPin} to ${id}`);

        // Check mill
        const didMill = checkMillState(id, nextBoard, turn);
        if (didMill) {
          triggerBannerAlert(`★ DAADI! ${turn.toUpperCase()} formed a mill sliding to spot ${id}!`);
        }

        // Pass turn
        setTurn(turn === 'green' ? 'gold' : 'green');
      }
    }
  };

  const handleResetBoard = () => {
    setBoard({
      1: 'green', 2: null, 3: null, 4: 'gold', 5: 'green', 6: null, 7: null, 8: null,
      9: 'green', 10: null, 11: null, 12: 'gold', 13: null, 14: null, 15: null, 16: null,
      17: null, 18: null, 19: null, 20: null, 21: null, 22: null, 23: null, 24: null
    });
    setPhase('placing');
    setTurn('green');
    setGreenToPlace(6);
    setGoldToPlace(7);
    setSelectedPin(null);
    setGameMessage("Board reset! Place remaining pieces to start.");
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen font-sans bg-parchment text-coffee selection:bg-gold-accent selection:text-wood">
      
      {/* Decorative Traditional Vintage Background Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#eeddbb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-30"></div>

      {/* STICKY NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#faedd4]/95 backdrop-blur-md border-b border-coffee/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div 
            onClick={() => handleScrollTo('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 bg-coffee text-parchment rounded-lg flex items-center justify-center font-display font-extrabold text-2xl shadow-md border-2 border-gold-accent group-hover:scale-105 transition-transform">
              D
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-accent rounded-full border border-coffee"></div>
            </div>
            <div>
              <span className="font-display font-extrabold text-2xl tracking-wider text-wood">DAADI</span>
              <p className="text-[10px] font-mono tracking-widest uppercase text-gold-dark font-semibold">Fine Strategy</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => handleScrollTo('home')}
              className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'home' ? 'text-wood underline decoration-gold-accent decoration-2 underline-offset-8' : 'text-coffee/70 hover:text-wood'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleScrollTo('game-interactive')}
              className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'game-interactive' ? 'text-wood underline decoration-gold-accent decoration-2 underline-offset-8' : 'text-coffee/70 hover:text-wood'}`}
            >
              Interactive Board
            </button>
            <button 
              onClick={() => handleScrollTo('rules-guide')}
              className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'rules-guide' ? 'text-wood underline decoration-gold-accent decoration-2 underline-offset-8' : 'text-coffee/70 hover:text-wood'}`}
            >
              How To Play
            </button>
            <button 
              onClick={() => handleScrollTo('privacy-policy')}
              className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'privacy-policy' ? 'text-wood underline decoration-gold-accent decoration-2 underline-offset-8' : 'text-coffee/70 hover:text-wood'}`}
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleScrollTo('terms-of-service')}
              className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'terms-of-service' ? 'text-wood underline decoration-gold-accent decoration-2 underline-offset-8' : 'text-coffee/70 hover:text-wood'}`}
            >
              Terms of Service
            </button>
          </nav>

          {/* Call-to-action button */}
          <div className="flex items-center space-x-3">
            <a 
              href="mailto:botlasaiprasadraobotla@gmail.com" 
              className="bg-board-green hover:bg-board-green-light text-parchment text-xs sm:text-sm font-semibold px-4 py-2 rounded-full flex items-center space-x-2 border border-coffee/20 shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Mail size={14} />
              <span className="hidden sm:inline">Support & Contact</span>
              <span className="inline sm:hidden">Support</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative pt-12 pb-20 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Info */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
            <div className="inline-flex items-center space-x-2 bg-coffee/5 border border-coffee/10 px-3 py-1.5 rounded-full self-start">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-dark"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-coffee/80 uppercase">Now in Development / Google Play Ready</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl text-wood tracking-tight leading-none">
                DAADI
              </h1>
              <p className="font-serif italic text-xl sm:text-2xl text-gold-dark font-medium leading-relaxed">
                "The Traditional Strategy Game, Redefined."
              </p>
              <div className="h-1 w-24 bg-gold-accent rounded-full"></div>
            </div>

            <p className="text-lg text-coffee/90 leading-relaxed max-w-xl font-sans font-light">
              Experience the ancient strategic alignment game from India and Rome, revived for the modern era. Duel players worldwide, make tactical blocks, and forge unstoppable triple-alignments (Mills) on the ultimate board of wits. Fully compatible with Google Play Services and real-time WebSockets synchronization.
            </p>

            {/* Micro Badges of modern ecosystem integrations */}
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              <div className="flex flex-col items-center p-3 bg-white/60 rounded-xl border border-coffee/10 shadow-sm">
                <Users size={18} className="text-board-green mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-wood font-extrabold text-center">Supabase Matches</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white/60 rounded-xl border border-coffee/10 shadow-sm">
                <Zap size={18} className="text-gold-dark mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-wood font-extrabold text-center">PieSocket Active</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-white/60 rounded-xl border border-coffee/10 shadow-sm">
                <Smartphone size={18} className="text-coffee mb-1" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-wood font-extrabold text-center">Android Client</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => handleScrollTo('game-interactive')}
                className="bg-coffee hover:bg-wood text-parchment font-bold px-6 py-3.5 rounded-full flex items-center space-x-2 border-2 border-gold-dark shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm md:text-base group"
              >
                <Play size={16} className="fill-current text-gold-accent group-hover:scale-110 transition-transform" />
                <span>Try Board Sandbox</span>
              </button>

              <button 
                onClick={() => handleScrollTo('privacy-policy')}
                className="bg-transparent hover:bg-coffee/5 text-coffee font-semibold px-6 py-3.5 rounded-full flex items-center space-x-2 border border-coffee hover:border-wood transition-colors text-sm"
              >
                <BookOpen size={16} />
                <span>Read Legal Terms</span>
              </button>
            </div>

            <div className="text-xs text-coffee/60 flex items-center space-x-2">
              <span className="inline-block w-1.5 h-1.5 bg-coffee/40 rounded-full"></span>
              <span>Fully compliant for developers distributing through Google Play.</span>
            </div>
          </div>

          {/* Hero Right Visual Column - Custom Illustration of Wood Board */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="absolute -inset-4 bg-gold-accent/10 rounded-3xl blur-2xl transform rotate-3 scale-95 pointer-events-none"></div>
            <div className="relative bg-gradient-to-br from-white/75 to-white/45 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-coffee/15 shadow-xl w-full max-w-lg flex flex-col items-center justify-center">
              
              <div className="w-full flex items-center justify-between mb-4 pb-4 border-b border-coffee/10">
                <div className="flex items-center space-x-2">
                  <Award size={20} className="text-gold-dark" />
                  <span className="text-xs font-serif italic text-wood font-bold">Classic Nine Men's Morris Variant</span>
                </div>
                <span className="text-[10px] bg-coffee/10 font-bold px-2.5 py-1 rounded-full text-coffee font-mono">DAADI GRAPHIC</span>
              </div>

              {/* Static Representation / Mini Aesthetic Preview of the Board layout */}
              <div className="relative w-full aspect-square border-4 border-wood bg-[#EDD3A7] rounded-xl flex items-center justify-center p-3 shadow-inner">
                {/* Wood Grains Pattern Simulation */}
                <div className="absolute inset-0 opacity-15 overflow-hidden rounded-lg pointer-events-none">
                  <div className="absolute w-[200%] h-[200%] rotate-12 border-y-[4px] border-coffee/25 select-none -translate-x-12 -translate-y-12"></div>
                  <div className="absolute w-[180%] h-[180%] rotate-36 border-y-[2px] border-coffee/15 select-none -translate-x-24 -translate-y-8"></div>
                </div>

                {/* SVG drawing Concentric Squares & alignment lines */}
                <svg viewBox="0 0 600 600" className="w-full h-full relative pointer-events-none">
                  {/* Lines of outer, middle, inner squares */}
                  <rect x="50" y="50" width="500" height="500" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />
                  <rect x="130" y="130" width="340" height="340" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />
                  <rect x="210" y="210" width="180" height="180" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />

                  {/* Midline linkages */}
                  <line x1="300" y1="50" x2="300" y2="210" stroke="#5C2D0A" strokeWidth="8" strokeLinecap="round" />
                  <line x1="300" y1="390" x2="300" y2="550" stroke="#5C2D0A" strokeWidth="8" strokeLinecap="round" />
                  <line x1="50" y1="300" x2="210" y2="300" stroke="#5C2D0A" strokeWidth="8" strokeLinecap="round" />
                  <line x1="390" y1="300" x2="550" y2="300" stroke="#5C2D0A" strokeWidth="8" strokeLinecap="round" />

                  {/* Decorative Intersect Points with small nodes */}
                  {BOARD_POINTS.map(pt => (
                    <circle 
                      key={pt.id} 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="10" 
                      fill="#B38F1F" 
                      stroke="#5C2D0A" 
                      strokeWidth="3" 
                    />
                  ))}

                  {/* Simulated standard board state with few tokens on it */}
                  <circle cx="50" cy="50" r="28" fill="#2C4A34" stroke="#5C2D0A" strokeWidth="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
                  <circle cx="50" cy="50" r="14" fill="none" stroke="#faedd4" strokeWidth="3" opacity="0.5" />
                  
                  <circle cx="550" cy="300" r="28" fill="#D4AF37" stroke="#5C2D0A" strokeWidth="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
                  <circle cx="550" cy="300" r="14" fill="none" stroke="#3D1E06" strokeWidth="3" opacity="0.3" />

                  <circle cx="550" cy="550" r="28" fill="#2C4A34" stroke="#5C2D0A" strokeWidth="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
                  <circle cx="550" cy="550" r="14" fill="none" stroke="#faedd4" strokeWidth="3" opacity="0.5" />

                  <circle cx="470" cy="300" r="28" fill="#D4AF37" stroke="#5C2D0A" strokeWidth="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
                  <circle cx="470" cy="300" r="14" fill="none" stroke="#3D1E06" strokeWidth="3" opacity="0.3" />

                  <circle cx="130" cy="130" r="28" fill="#2C4A34" stroke="#5C2D0A" strokeWidth="5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))" />
                  <circle cx="130" cy="130" r="14" fill="none" stroke="#faedd4" strokeWidth="3" opacity="0.5" />
                </svg>

              </div>

              {/* Board Footer Label */}
              <div className="mt-4 text-center">
                <p className="text-xs font-serif text-coffee/80 italic">Representing three concentric alignment squares connected by vertical/horizontal lines.</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE BOARD SANDBOX */}
      <section id="game-interactive" className="py-16 bg-white/40 border-y border-coffee/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-wood flex items-center justify-center space-x-2">
              <span>Interactive Daadi Arena</span>
            </h2>
            <div className="h-0.5 w-16 bg-gold-accent mx-auto mt-3"></div>
            <p className="text-sm text-coffee/70 uppercase font-mono tracking-widest font-semibold mt-2">Test Your Alignment Logic</p>
            <p className="text-base text-coffee/80 mt-4 leading-relaxed font-serif italic text-center max-w-2xl mx-auto">
              Welcome to the digital sandbox. Play in hotseat mode on this standard board to understand the geometric mechanics of Daadi (Nine Men's Morris)! Click to place or move pieces.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Control Panel (left on desktop) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-6 bg-[#FaEDD4]/70 p-6 rounded-2xl border border-coffee/15 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-coffee/15">
                  <span className="text-xs font-mono uppercase tracking-wider text-coffee font-extrabold flex items-center space-x-1.5">
                    <Activity size={14} className="text-board-green" />
                    <span>Arena Status</span>
                  </span>
                  <span className="bg-coffee text-parchment text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                    {phase === 'placing' ? 'Placing State' : 'Sliding State'}
                  </span>
                </div>

                {/* Simulated Turn State */}
                <div className="p-4 rounded-xl border border-coffee/10 bg-white/60 shadow-sm flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full border-2 border-coffee flex items-center justify-center transition-colors ${turn === 'green' ? 'bg-board-green shadow-[0_0_8px_rgba(44,74,52,0.4)]' : 'bg-gold-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]'}`}>
                    <span className="text-[10px] uppercase font-bold text-white text-center">
                      {turn === 'green' ? 'GRN' : 'GLD'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-coffee/60">Active Player Turn</span>
                    <h3 className="font-display font-extrabold text-lg text-wood">
                      {turn === 'green' ? 'Earthy Green' : 'Royal Gold'}
                    </h3>
                  </div>
                </div>

                {/* Placing Counters display */}
                {phase === 'placing' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/40 rounded-xl border border-coffee/5 flex flex-col justify-center items-center">
                      <span className="text-[9px] font-mono text-coffee/60 uppercase font-bold">Green Left</span>
                      <span className="text-2xl font-display font-extrabold text-board-green">{greenToPlace}</span>
                    </div>
                    <div className="p-3 bg-white/40 rounded-xl border border-coffee/5 flex flex-col justify-center items-center">
                      <span className="text-[9px] font-mono text-coffee/60 uppercase font-bold">Gold Left</span>
                      <span className="text-2xl font-display font-extrabold text-gold-dark">{goldToPlace}</span>
                    </div>
                  </div>
                )}

                {/* Context Tip Box */}
                <div className="p-4 rounded-xl bg-board-green/5 border border-board-green/10 flex items-start space-x-3">
                  <Info size={16} className="text-board-green mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs leading-relaxed text-board-green font-semibold">
                      {gameMessage}
                    </p>
                    <p className="text-[11px] text-coffee/70 leading-normal">
                      {phase === 'placing' 
                        ? "Click any black/golden point node on the board lines to lock in your token." 
                        : "Click your piece, then click a connected empty slot to slide. Only adjacent links are allowed."}
                    </p>
                  </div>
                </div>

                {/* Neighbors and Selections trace details */}
                {selectedPin !== null && (
                  <div className="text-xs p-3 bg-gold-accent/10 border border-gold-accent/25 rounded-lg">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-wood font-extrabold">Active Selection:</span>
                    <p className="font-serif">Point ID #{selectedPin}. Valid adjacent options to slide to: <span className="font-bold">{(ADJACENCY[selectedPin] || []).join(', ')}</span></p>
                  </div>
                )}
              </div>

              {/* Reset Control */}
              <div className="pt-4 border-t border-coffee/10">
                <button 
                  onClick={handleResetBoard}
                  className="w-full bg-coffee hover:bg-wood text-parchment text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 border border-coffee/10 shadow-sm hover:shadow active:scale-98 transition-all"
                >
                  <RefreshCw size={13} className="animate-spin-slow" />
                  <span>Restart Board Sandbox</span>
                </button>
                <p className="text-[10px] text-center text-coffee/50 font-mono mt-2">Simulated client board engine</p>
              </div>

            </div>

            {/* Interactive SVG board (centered) */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#FAEDD4] to-[#f4e2c0] p-6 rounded-2xl border-2 border-wood shadow-inner relative">
              
              {/* Outer Board Frame Lines */}
              <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-widest text-[#5C2D0A]/30">DAADI BOARD STANDARD</div>
              <div className="absolute bottom-3 right-3 text-[9px] font-mono tracking-wider text-[#5C2D0A]/35 text-right font-semibold">TAP EMPTY NODES TO INTERACT</div>

              <div className="w-full max-w-lg aspect-square relative">
                
                {/* Embedded Board SVG */}
                <svg viewBox="0 0 600 600" className="w-full h-full relative z-10">
                  
                  {/* Concentric Square Outlines */}
                  <rect x="50" y="50" width="500" height="500" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />
                  <rect x="130" y="130" width="340" height="340" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />
                  <rect x="210" y="210" width="180" height="180" fill="none" stroke="#5C2D0A" strokeWidth="8" strokeLinejoin="miter" />

                  {/* Midline linkages */}
                  <line x1="300" y1="50" x2="300" y2="210" stroke="#5C2D0A" strokeWidth="8" />
                  <line x1="300" y1="390" x2="300" y2="550" stroke="#5C2D0A" strokeWidth="8" />
                  <line x1="50" y1="300" x2="210" y2="300" stroke="#5C2D0A" strokeWidth="8" />
                  <line x1="390" y1="300" x2="550" y2="300" stroke="#5C2D0A" strokeWidth="8" />

                  {/* Board Intersect Links / Click Targets */}
                  {BOARD_POINTS.map(pt => {
                    const owner = board[pt.id];
                    const isSelected = selectedPin === pt.id;
                    const isValidMoveOption = selectedPin !== null && (ADJACENCY[selectedPin] || []).includes(pt.id) && owner === null;

                    return (
                      <g 
                        key={pt.id} 
                        className="cursor-pointer group" 
                        onClick={() => handlePointClick(pt.id)}
                      >
                        {/* Hidden broader click shield target for touch screen accessibility */}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="28" 
                          fill="transparent" 
                        />

                        {/* Interactive Highlight Ring when selected/valid */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r="32" 
                              fill="none" 
                              stroke="#D4AF37" 
                              strokeWidth="4"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
                            />
                          )}
                          {isValidMoveOption && (
                            <motion.circle
                              cx={pt.x}
                              cy={pt.y}
                              r="26"
                              fill="none"
                              stroke="#B38F1F"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                              initial={{ rotate: 0 }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            />
                          )}
                        </AnimatePresence>

                        {/* Default point dot marker */}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r="12" 
                          fill="#D4AF37" 
                          stroke="#5C2D0A" 
                          strokeWidth="3.5" 
                          className="group-hover:scale-125 transition-transform"
                        />

                        {/* Token Overlay */}
                        {owner === 'green' && (
                          <g>
                            {/* Piece Drop Shadow */}
                            <circle cx={pt.x} cy={pt.y} r="26" fill="black" opacity="0.25" transform="translate(0, 3)" />
                            {/* Main piece wood green body */}
                            <circle cx={pt.x} cy={pt.y} r="24" fill="#2C4A34" stroke="#5C2D0A" strokeWidth="4" />
                            {/* Inner concentric pattern ring */}
                            <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke="rgba(250,237,212,0.4)" strokeWidth="2.5" />
                            <circle cx={pt.x} cy={pt.y} r="3" fill="rgba(250,237,212,0.7)" />
                          </g>
                        )}

                        {owner === 'gold' && (
                          <g>
                            {/* Piece Drop Shadow */}
                            <circle cx={pt.x} cy={pt.y} r="26" fill="black" opacity="0.25" transform="translate(0, 3)" />
                            {/* Main piece golden body */}
                            <circle cx={pt.x} cy={pt.y} r="24" fill="#D4AF37" stroke="#5C2D0A" strokeWidth="4" />
                            {/* Inner concentric pattern ring */}
                            <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke="#faedd4" strokeWidth="2" />
                            <circle cx={pt.x} cy={pt.y} r="3" fill="#5C2D0A" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Vector Wood board background fiber decoration behind SVG */}
                <div className="absolute inset-0 bg-[#eed6aa] border-4 border-dashed border-wood/25 rounded-2xl pointer-events-none opacity-40"></div>
              </div>

              {/* Simulation Logs / Sound cue ticker feedback line */}
              <div className="mt-4 w-full bg-white/70 py-2.5 px-4 rounded-xl border border-coffee/10 flex items-center justify-between text-xs space-x-2">
                <span className="font-mono text-[10px] text-coffee/60 uppercase font-black">Move Log:</span>
                <span className="font-serif italic text-wood truncate font-medium">
                  {soundEffectPlayed ? `▶ ${soundEffectPlayed}` : 'Ready. Click points to trace wood pieces.'}
                </span>
                <span className="text-[10px] bg-board-green/10 text-board-green font-mono px-2 py-0.5 rounded font-bold">LOCAL</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* DETAILED GAME RULES / GUIDE */}
      <section id="rules-guide" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <BookOpen className="text-gold-dark mx-auto mb-3" size={32} />
          <h2 className="font-display font-black text-3xl sm:text-4xl text-wood">
            The Rules of the Game
          </h2>
          <div className="h-0.5 w-16 bg-gold-accent mx-auto mt-3"></div>
          <p className="text-xs font-mono uppercase tracking-widest text-gold-dark font-extrabold mt-1">Conquer the alignments</p>
          <p className="text-base text-coffee/80 mt-4 leading-relaxed font-serif max-w-xl mx-auto">
            Daadi (traditional alignment) is simple to learn but possesses profound tactical depth. Master its three distinct modular phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Phase 1 Card */}
          <div className="bg-white/60 p-6 rounded-2xl border border-coffee/10 hover:border-gold-accent/50 transition-all shadow-sm flex flex-col justify-between group hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-board-green/10 rounded-xl flex items-center justify-center font-display font-extrabold text-board-green text-xl group-hover:scale-110 transition-transform">
                01
              </div>
              <h3 className="font-display font-extrabold text-lg text-wood">Phase 1: Placing</h3>
              <p className="text-sm text-coffee/80 leading-relaxed font-sans">
                Each player starts with **9 tokens**. Alternating turns, you place your tokens onto empty intersections of the concentric board. Strategize defensive nodes immediately.
              </p>
            </div>
            <span className="text-xs font-mono text-gold-dark font-semibold mt-4 flex items-center">
              <span>Position carefully</span>
              <ChevronRight size={12} className="ml-1" />
            </span>
          </div>

          {/* Phase 2 Card */}
          <div className="bg-white/60 p-6 rounded-2xl border border-coffee/10 hover:border-gold-accent/50 transition-all shadow-sm flex flex-col justify-between group hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gold-accent/10 rounded-xl flex items-center justify-center font-display font-extrabold text-gold-dark text-xl group-hover:scale-110 transition-transform">
                02
              </div>
              <h3 className="font-display font-extrabold text-lg text-wood">Phase 2: Sliding</h3>
              <p className="text-sm text-coffee/80 leading-relaxed font-sans">
                Once all 9 tokens are entered, players take turn sliding one of their chips along the painted line grid into an **adjacent empty intersection**. No jumping allowed.
              </p>
            </div>
            <span className="text-xs font-mono text-gold-dark font-semibold mt-4 flex items-center">
              <span>Control the lines</span>
              <ChevronRight size={12} className="ml-1" />
            </span>
          </div>

          {/* Phase 3 Card */}
          <div className="bg-white/60 p-6 rounded-2xl border border-coffee/10 hover:border-gold-accent/50 transition-all shadow-sm flex flex-col justify-between group hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-coffee/5 rounded-xl flex items-center justify-center font-display font-extrabold text-wood text-xl group-hover:scale-110 transition-transform">
                03
              </div>
              <h3 className="font-display font-extrabold text-lg text-wood">Phase 3: The Daadi</h3>
              <p className="text-sm text-coffee/80 leading-relaxed font-sans">
                Align **3 of your tokens** on a straight row or column line. Forming this mill allows you to permanently **capture and remove** one opponent piece of your choice.
              </p>
            </div>
            <span className="text-xs font-mono text-gold-dark font-semibold mt-4 flex items-center">
              <span>Trigger a Mill</span>
              <ChevronRight size={12} className="ml-1" />
            </span>
          </div>

          {/* Phase 4 Card */}
          <div className="bg-white/60 p-6 rounded-2xl border border-coffee/10 hover:border-gold-accent/50 transition-all shadow-sm flex flex-col justify-between group hover:-translate-y-1">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-board-green-light/10 rounded-xl flex items-center justify-center font-display font-extrabold text-board-green-light text-xl group-hover:scale-110 transition-transform">
                04
              </div>
              <h3 className="font-display font-extrabold text-lg text-wood">Winning Duals</h3>
              <p className="text-sm text-coffee/80 leading-relaxed font-sans">
                You win the strategic duel immediately once the opponent is reduced to **2 tokens** (cannot form a "Daadi" mill anymore) or is **safely trapped** with zero legal movements left.
              </p>
            </div>
            <span className="text-xs font-mono text-gold-dark font-semibold mt-4 flex items-center">
              <span>Claim victory</span>
              <ChevronRight size={12} className="ml-1" />
            </span>
          </div>

        </div>

        {/* Additional Strategy Features Card */}
        <div className="mt-12 bg-[#FaEDD4] border border-coffee/15 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-coffee/10 pb-4 md:pb-0 md:pr-6">
            <h4 className="font-display font-extrabold text-lg text-wood">System Fair Play Note</h4>
            <p className="text-xs text-coffee/70 font-mono mt-1">Multiplayer Synchronization rules</p>
            <div className="flex items-center space-x-2 mt-4 text-board-green">
              <Timer size={18} />
              <span className="text-sm font-semibold">30s Move Timer Enabled</span>
            </div>
          </div>
          <div className="md:col-span-2 text-sm text-coffee/80 leading-relaxed">
            <p className="font-serif italic font-medium mb-2">"Time limit preserves ancient integrity."</p>
            <p className="font-sans">
              To guarantee fluid matches across our digital WebSockets infrastructure, a **30-second turn timer** is strictly enforced. If a user fails to lock a sliding coordination code within the allotted 30 seconds, an automated default pass mechanism preserves game continuity.
            </p>
          </div>
        </div>

      </section>

      {/* LEGAL & DOCUMENTATION CONTAINER (MAIN WRAPPER) */}
      <section className="bg-[#FAE9D1]/55 border-t border-coffee/10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Scale className="text-coffee/80 mx-auto mb-3" size={30} />
            <span className="text-xs font-mono font-bold tracking-widest text-gold-dark uppercase">Regulatory & App Store Alignment</span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-wood mt-1">
              Legal Documents
            </h2>
            <div className="h-0.5 w-12 bg-gold-accent mx-auto mt-3"></div>
            <p className="text-sm text-coffee/70 max-w-md mx-auto mt-3">
              Official legal notices and agreements required for Google Play Store compliance, designed for absolute readability.
            </p>
          </div>

          {/* TWO COLUMN NAVIGATION LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* COLUMN 1: STICKY VIEWPORT DIRECTORY (LEFT) */}
            <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-4">
              <div className="bg-white/70 p-5 rounded-2xl border border-coffee/15 shadow-sm">
                <h3 className="text-xs font-mono uppercase tracking-widest text-wood font-black mb-4 pb-2 border-b border-coffee/10">
                  Folder Directory
                </h3>
                <ul className="space-y-3.5 text-sm">
                  <li>
                    <button 
                      onClick={() => handleScrollTo('privacy-policy')}
                      className={`flex items-center space-x-2.5 w-full text-left font-semibold transition-colors ${activeSection === 'privacy-policy' ? 'text-wood font-bold' : 'text-coffee/60 hover:text-coffee'}`}
                    >
                      <Shield size={16} className={activeSection === 'privacy-policy' ? 'text-board-green' : 'text-coffee/40'} />
                      <span>1. Privacy Policy</span>
                    </button>
                    <div className="pl-6 border-l border-coffee/10 mt-2 space-y-2 text-xs font-serif text-coffee/60">
                      <p>1.1 Information Collected</p>
                      <p>1.2 Purpose of Use</p>
                      <p>1.3 Secure Storage</p>
                      <p>1.4 Third-Party APIs</p>
                      <p>1.5 Your Data Rights</p>
                    </div>
                  </li>
                  <li className="pt-3 border-t border-coffee/10">
                    <button 
                      onClick={() => handleScrollTo('terms-of-service')}
                      className={`flex items-center space-x-2.5 w-full text-left font-semibold transition-colors ${activeSection === 'terms-of-service' ? 'text-wood font-bold' : 'text-coffee/60 hover:text-coffee'}`}
                    >
                      <FileText size={16} className={activeSection === 'terms-of-service' ? 'text-gold-dark' : 'text-coffee/40'} />
                      <span>2. Terms of Service</span>
                    </button>
                    <div className="pl-6 border-l border-coffee/10 mt-2 space-y-2 text-xs font-serif text-coffee/60">
                      <p>2.1 License Grant</p>
                      <p>2.2 Strict Player Conduct</p>
                      <p>2.3 Account Obligations</p>
                      <p>2.4 Timed Game Limits</p>
                      <p>2.5 Termination Conditions</p>
                      <p>2.6 Warranty Exclusion</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Quick Legal Help Banner */}
              <div className="bg-wood text-parchment p-5 rounded-2xl border-2 border-gold-accent shadow-md">
                <span className="text-[9px] font-mono tracking-widest text-gold-accent uppercase font-black">Support Hotlines</span>
                <h4 className="font-display font-bold mt-1 text-sm text-white">Need to request data deletion?</h4>
                <p className="text-xs text-parchment/80 font-light mt-2 leading-relaxed">
                  Send an email with your registered username. Our legal database team handles account depopulation requests within 48 hours.
                </p>
                <a 
                  href="mailto:botlasaiprasadraobotla@gmail.com"
                  className="mt-4 w-full bg-gold-accent hover:bg-gold-dark text-wood font-bold text-center py-2 px-3 rounded-lg text-xs tracking-wide flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Mail size={12} />
                  <span>Email Support</span>
                </a>
              </div>
            </div>

            {/* COLUMN 2: FULL CONTENT SCROLL CONTAINER (RIGHT) */}
            <div className="lg:col-span-9 space-y-16">
              
              {/* --- 1. PRIVACY POLICY DOCUMENT CONTAINER --- */}
              <div 
                id="privacy-policy" 
                className="bg-[url('non-existent-noise')] bg-white/80 p-8 sm:p-12 rounded-3xl border-2 border-wood shadow-lg relative overflow-hidden"
              >
                {/* Decorative retro stamp or watermark corner */}
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-board-green/5 rounded-full flex items-center justify-center border border-board-green/10 pointer-events-none">
                  <Shield className="text-board-green/10" size={50} />
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-board-green/10 rounded-xl text-board-green">
                    <Shield size={22} />
                  </div>
                  <span className="text-xs font-mono tracking-wider font-extrabold uppercase text-board-green">Section One Document</span>
                </div>

                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-wood border-b border-coffee/15 pb-4 mb-4">
                  1. Privacy Policy
                </h2>

                <div className="inline-flex items-center space-x-2 bg-coffee/5 border border-coffee/5 px-3 py-1 rounded-full mb-8">
                  <span className="text-xs font-mono text-coffee/70 font-semibold">Effective Date: June 11, 2026</span>
                </div>

                {/* Body Text */}
                <div className="font-serif text-coffee/95 leading-relaxed text-base sm:text-lg space-y-6">
                  
                  <p className="font-medium text-wood text-lg italic">
                    Daadi ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application ("App").
                  </p>

                  <div className="space-y-4 pt-4 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">1.1</span>
                      <span>Information We Collect</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90 leading-relaxed">
                      To facilitate modern real-time matchmaking, synchronization, and historical tracking, the App collects specific essential components of data:
                    </p>
                    <ul className="list-disc pl-6 space-y-2.5 text-sm font-sans text-coffee/90">
                      <li>
                        <strong className="text-wood">Profile Information:</strong> When you register and initialize the client app, we collect your <span className="underline decoration-gold-accent">username</span> and verified <span className="underline decoration-gold-accent">email address</span>.
                      </li>
                      <li>
                        <strong className="text-wood">Match Data:</strong> We log game matches (specific board coordinate moves, wins, losses, play frequencies, and ratings) to display comprehensive stats.
                      </li>
                      <li>
                        <strong className="text-wood">Device Information:</strong> We may gather technical device indicators (device model, operating system version, and system logs) to fix crashes.
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">1.2</span>
                      <span>How We Use Your Information</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      The gathered insights are strictly mapped to gameplay and performance indicators:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm font-sans text-coffee/90">
                      <li>To provide and maintain the core App and digital services.</li>
                      <li>To facilitate real-time multiplayer matchmaking with adjacent peers.</li>
                      <li>To compile global leaderboards highlighting highest alignment rankings.</li>
                      <li>To communicate vital administrative warnings, security alerts, and system updates.</li>
                    </ul>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">1.3</span>
                      <span>Data Storage & Security</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      Our system leverages <strong className="text-wood">Supabase</strong> for secure, structured relational data storage and user credentials custody. While we enforce physical and transport security protocols, no vector of packet transmission or cloud architecture is completely immune. We urge users to maintain strong credentials.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">1.4</span>
                      <span>Third-Party Services</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      To power silent real-time alignments and secure play distribution, our systems interface with third-party frameworks:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div className="p-4 rounded-xl bg-[#faedd4] border border-coffee/10">
                        <span className="font-mono text-xs text-board-green font-bold uppercase tracking-wider block mb-1">REAL-TIME WEBSOCKETS</span>
                        <h4 className="font-display font-extrabold text-[15px] text-wood mb-1">PieSocket API</h4>
                        <p className="text-xs text-coffee/80 leading-normal">Manages low-latency real-time synchronization of board token moves and opponent disconnect detection.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[#faedd4] border border-coffee/10">
                        <span className="font-mono text-xs text-gold-dark font-bold uppercase tracking-wider block mb-1">APP DISTRIBUTION</span>
                        <h4 className="font-display font-extrabold text-[15px] text-wood mb-1">Google Play Services</h4>
                        <p className="text-xs text-coffee/80 leading-normal">Facilitates download integrity, in-app updates, and global developer verification parameters.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">1.5</span>
                      <span>Your Rights</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      You maintain full ownership of your data parameters. At any time, you could safely initiate an account deletion sequence directly through the App's configuration panel, or reach our compliance leads via email at: <a href="mailto:botlasaiprasadraobotla@gmail.com" className="text-board-green underline font-semibold font-mono hover:text-board-green-light">botlasaiprasadraobotla@gmail.com</a>.
                    </p>
                  </div>

                </div>
              </div>

              {/* --- 2. TERMS OF SERVICE DOCUMENT CONTAINER --- */}
              <div 
                id="terms-of-service" 
                className="bg-[url('non-existent-noise')] bg-white/80 p-8 sm:p-12 rounded-3xl border-2 border-wood shadow-lg relative overflow-hidden"
              >
                {/* Decorative watermark */}
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-gold-accent/5 rounded-full flex items-center justify-center border border-gold-accent/10 pointer-events-none">
                  <FileText className="text-gold-accent/10" size={50} />
                </div>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 bg-gold-accent/15 rounded-xl text-gold-dark">
                    <FileText size={22} />
                  </div>
                  <span className="text-xs font-mono tracking-wider font-extrabold uppercase text-gold-dark animate-pulse">Section Two Document</span>
                </div>

                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-wood border-b border-coffee/15 pb-4 mb-4">
                  2. Terms of Service
                </h2>

                <div className="inline-flex items-center space-x-2 bg-coffee/5 border border-coffee/5 px-3 py-1 rounded-full mb-8">
                  <span className="text-xs font-mono text-coffee/70 font-semibold">Last Updated: June 11, 2026</span>
                </div>

                {/* Body Text */}
                <div className="font-serif text-coffee/95 leading-relaxed text-base sm:text-lg space-y-6">
                  
                  <p className="font-medium text-wood text-lg italic animate-fade-in">
                    By downloading, installing, or interacting with the Daadi mobile application, you agree to comply with and represent legal consent to the following structured terms.
                  </p>

                  <div className="space-y-4 pt-4 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.1</span>
                      <span>License Grant</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      We grant you a temporary, personal, non-commercial, revocable, and non-transferable license to execute and play the App on your mobile device for personal entertainment.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.2</span>
                      <span>User Conduct</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      To preserve the authentic psychological safety of our co-playing digital library, users agree NOT to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-sm font-sans text-coffee/90 text-red-950">
                      <li>Use unfair tools, cheats, memory injectors, or automated bots to gain mathematical alignment advantages.</li>
                      <li>Harass, threaten, or abuse other real-time competitors inside global chats or open matches.</li>
                      <li>Attempt unauthorized server injection, vulnerability scanning, or disruption of the WebSockets framework.</li>
                      <li>Register or display highly offensive, profane, or hostile usernames.</li>
                    </ul>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.3</span>
                      <span>Account Responsibility</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      You represent full custody of your account credentials. The core development squad holds zero responsibility for data deletions resulting from user-side session credential compromises.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.4</span>
                      <span>Multiplayer Fair Play</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      Real-time competitive matches are governed by a strictly regulated **30-second move timer**. Failure to execute a coordinate slide within this limit triggers an automatic turn forfeit to sustain game fluidity.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.5</span>
                      <span>Termination</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90">
                      We reserve the unilateral right to suspend, terminate, or ban accounts caught breaching community standards or performing cyberattacks against the PieSocket/Supabase bridges.
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-coffee/5">
                    <h3 className="font-display font-bold text-xl text-wood flex items-center space-x-2">
                      <span className="text-gold-dark font-extrabold text-base font-mono">2.6</span>
                      <span>Disclaimer of Warranties</span>
                    </h3>
                    <p className="text-sm font-sans text-coffee/90 italic">
                      The application is delivered to consumers globally "as is" and "as available". We provide zero warranties of complete server uptime or absolute bug-free state. Use at your sovereign discretion.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-wood text-parchment/90 border-t-2 border-gold-accent py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 items-start">
          
          {/* Footer Branding */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-parchment text-wood rounded flex items-center justify-center font-display font-extrabold text-xl shadow border border-gold-accent">
                D
              </div>
              <span className="font-display font-bold text-2xl tracking-widest text-white">DAADI</span>
            </div>
            <p className="text-sm text-parchment/75 leading-relaxed max-w-sm">
              An elegant ancient strategic alignment board game revived on digital canvases. Providing tranquil gameplay and classic matching arrays in full harmony.
            </p>
            <div className="flex space-x-3 text-xs font-mono font-bold text-gold-accent">
              <span>SUPABASE READY</span>
              <span>•</span>
              <span>PIESOCKET SUPPORTED</span>
              <span>•</span>
              <span>VITE ENGINE</span>
            </div>
          </div>

          {/* Quick legal pathways */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Navigations</h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <button onClick={() => handleScrollTo('home')} className="hover:text-gold-accent text-parchment/80 text-left transition-colors">
                  Top Home
                </button>
              </li>
              <li>
                <button onClick={() => handleScrollTo('game-interactive')} className="hover:text-gold-accent text-parchment/80 text-left transition-colors">
                  Interactive Board Sandbox
                </button>
              </li>
              <li>
                <button onClick={() => handleScrollTo('rules-guide')} className="hover:text-gold-accent text-parchment/80 text-left transition-colors">
                  Rules and Layouts
                </button>
              </li>
              <li>
                <button onClick={() => handleScrollTo('privacy-policy')} className="hover:text-gold-accent text-parchment/80 text-left transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleScrollTo('terms-of-service')} className="hover:text-gold-accent text-parchment/80 text-left transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Contact support */}
          <div>
            <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Support Channels</h4>
            <p className="text-sm text-parchment/75 mb-4 leading-relaxed">
              Have user integrity suggestions, bugs, or data erasure demands?
            </p>
            <a 
              href="mailto:botlasaiprasadraobotla@gmail.com"
              className="inline-flex items-center space-x-2 bg-gold-accent hover:bg-gold-dark text-wood font-extrabold text-xs tracking-wider py-2 px-4 rounded-xl transition-all hover:scale-105"
            >
              <Mail size={12} />
              <span>Contact Developers</span>
            </a>
            <p className="text-[10px] text-parchment/50 font-mono mt-3">botlasaiprasadraobotla@gmail.com</p>
          </div>

        </div>

        {/* Outer bottom credits block */}
        <div className="max-w-7xl mx-auto border-t border-parchment/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-parchment/60 space-y-4 sm:space-y-0">
          <p>© 2026 DAADI Board Game Project. All rights reserved globally.</p>
          <div className="flex space-x-4">
            <button onClick={() => handleScrollTo('privacy-policy')} className="hover:underline">Privacy Terms</button>
            <span>|</span>
            <button onClick={() => handleScrollTo('terms-of-service')} className="hover:underline">Terms of Service</button>
          </div>
        </div>
      </footer>

      {/* FLOAT BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="back-to-top"
            onClick={() => handleScrollTo('home')}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-coffee hover:bg-wood text-parchment border-2 border-gold-accent shadow-xl hover:shadow-2xl transition-all cursor-pointer active:scale-90"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            whileHover={{ y: -3 }}
            title="Scroll back to Top"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
}

