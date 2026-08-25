/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Stars, MessageCircle, BookOpen, Send, Sparkles, ChevronDown, X, Video, Play, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { getHeartfeltReply } from './services/gemini';

// Types
interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Letter {
  id: number;
  title: string;
  content: string;
  signature: string;
}

// --- PERSONALIZATION SECTION ---
// Dedicated to Aunty Dupe!

const RHEMA_NAME = "Aunty Dupe";

const REASONS = [
  "Your warm, welcoming heart that makes me feel safe",
  "How you always show up with boundless love, wisdom, and kindness.",
  "You are always supportive, whether things are going well or not, I know I can count on you.",
  "You give the best advice, your wisdom has helped me make better decisions and see things differently.",
  "How you celebrate all of my milestones with genuine joy and pride.",
  "You make me feel loved, you have a special way of making me feel valued and appreciated.",
  "You believe in me even when I doubt myself, you remind me of what I'm capable of.",
  "The way you pray for me, encourage me, and believe in my dreams.",
  "You have such a kind heart. The way you care for people shows how beautiful your heart is.",
  "Beyond everything you do for me, I love you because you are you, and I'm genuinely grateful to have you in my life.❤️"
];

function formatDirectImageUrl(url: string): string {
  if (!url) return url;
  let formatted = url.trim();
  
  if (formatted.includes('dropbox.com') || formatted.includes('dropboxusercontent.com')) {
    // For Dropbox scl/fi links, www.dropbox.com with raw=1 directs cleanly
    formatted = formatted.replace('dl.dropboxusercontent.com', 'www.dropbox.com');
    formatted = formatted.replace(/[?&]dl=[01]/, '');
    if (!formatted.includes('raw=1')) {
      formatted += (formatted.includes('?') ? '&' : '?') + 'raw=1';
    }
  }
  return formatted;
}

function HeroImageLayer({ url, isActive }: { url: string; isActive: boolean }) {
  const directUrl = formatDirectImageUrl(url);
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}`;
  const [imgSrc, setImgSrc] = useState(directUrl);
  const [retryStage, setRetryStage] = useState(0);

  const handleError = () => {
    if (retryStage === 0) {
      setRetryStage(1);
      setImgSrc(proxyUrl);
    } else if (retryStage === 1) {
      setRetryStage(2);
      setImgSrc(directUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com'));
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt="Aunty Dupe Hero" 
      loading="eager"
      decoding="sync"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={`absolute inset-0 w-full h-full object-cover object-[center_20%] filter brightness-[0.92] contrast-[1.02] transition-opacity duration-1000 ease-in-out ${
        isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
      }`}
    />
  );
}

function HeroSlideshow() {
  // Candidate images: 9th (index 8) and 11th (index 10) from PHOTO_DUMP
  const heroCandidates = [PHOTO_DUMP[8], PHOTO_DUMP[10]];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // Preload both candidate images into browser memory immediately
    heroCandidates.forEach((url) => {
      const direct = formatDirectImageUrl(url);
      const img1 = new Image();
      img1.src = direct;
      const img2 = new Image();
      img2.src = `https://images.weserv.nl/?url=${encodeURIComponent(direct)}`;
    });

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroCandidates.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {heroCandidates.map((url, idx) => (
        <HeroImageLayer key={url} url={url} isActive={idx === activeIndex} />
      ))}
      {/* Light subtle dark gradient overlay for optimal readability while keeping her face bright and clear */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />
    </div>
  );
}

function PhotobookImage({ url, index, fitMode = 'cover' }: { url: string; index: number; fitMode?: 'cover' | 'contain' }) {
  const directUrl = formatDirectImageUrl(url);
  // Proxy URL using weserv.nl if direct raw link fails due to CORS or host restriction
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}`;
  const [imgSrc, setImgSrc] = useState(directUrl);
  const [retryStage, setRetryStage] = useState(0);

  const handleError = () => {
    if (retryStage === 0) {
      // Try proxy url
      setRetryStage(1);
      setImgSrc(proxyUrl);
    } else if (retryStage === 1) {
      // Try dl.dropboxusercontent.com format with raw=1
      setRetryStage(2);
      setImgSrc(directUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com'));
    }
  };

  return (
    <img 
      src={imgSrc} 
      alt={`Memory ${index + 1}`} 
      className={`w-full h-full ${fitMode === 'contain' ? 'object-contain p-2 bg-gray-50/80' : 'object-cover'} transition-transform duration-1000 group-hover:scale-105`}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}

function VideoMessageSection() {
  const videoRawUrl = "https://www.dropbox.com/scl/fi/wkbjcudaacr9a25txrr71/0824.mp4?rlkey=a3mdsbsky8ywt6jfyj8y0axfb&raw=1";
  const videoDlUrl = "https://dl.dropboxusercontent.com/scl/fi/wkbjcudaacr9a25txrr71/0824.mp4?rlkey=a3mdsbsky8ywt6jfyj8y0axfb&dl=1";
  const videoWebUrl = "https://www.dropbox.com/scl/fi/wkbjcudaacr9a25txrr71/0824.mp4?rlkey=a3mdsbsky8ywt6jfyj8y0axfb&st=oux2kg8q&dl=0";

  return (
    <section className="py-24 relative z-10 overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-romantic-50/20 to-white border-b border-romantic-100/60">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-white/90 backdrop-blur-md p-8 md:p-14 rounded-[40px] shadow-2xl shadow-romantic-200/50 border border-romantic-100"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-romantic-100 rounded-full mb-6 ring-8 ring-romantic-50">
            <Video className="w-8 h-8 text-romantic-500" />
          </div>

          <div>
            <span className="text-xs uppercase font-semibold tracking-widest text-romantic-500 bg-romantic-50 px-4 py-1.5 rounded-full border border-romantic-100 inline-block mb-3">
              ✦ A Special Video Wish ✦
            </span>
          </div>

          <h2 className="serif text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Video Message from Toyosi
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto font-light leading-relaxed mb-8">
            Press play below to watch a video message recorded with love just for you, Aunty Dupe!
          </p>

          <div className="relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl border-2 border-romantic-200 group">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[650px] object-contain rounded-3xl mx-auto"
            >
              <source src={videoRawUrl} type="video/mp4" />
              <source src={videoDlUrl} type="video/quicktime" />
              Your browser does not support HTML video.
            </video>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={videoWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <ExternalLink className="w-4 h-4 text-romantic-300" />
              <span>Watch or Download on Dropbox</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const PHOTO_DUMP = [
  "https://dl.dropboxusercontent.com/scl/fi/0838znkjb1gxhhr2mgyr7/IMG_4139.jpg?rlkey=ht52oainlpc7mf0zrepff2yfg&st=xcfr0u3b&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/ya1fdlidyokapltb0s0n6/IMG_4140.jpg?rlkey=29iu32gztwlrhqg7sxkxio5qy&st=a50430ak&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/6uyw904f6lsy48qxgjz0y/IMG_4141.jpg?rlkey=6nhc5sr1j3qoggtrapysubobg&st=6swhvcim&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/2t78oiyi0lz823qokt0iu/IMG_4142.jpg?rlkey=qjerhlr4nxfd1z7vt6ijhcc9j&st=m5wmna1a&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/sg9e41gao9xuh63vh7t48/IMG_4143.jpg?rlkey=354b1nxxexu3oj9jsy6orr63u&st=fdun4tr0&raw=1",
  "https://www.dropbox.com/scl/fi/wg78ohaohhfh364jd2q67/e6aa4e88-e607-4a0a-a3b1-553f26aa221f.JPG?rlkey=fw95e1ocng3aob05tndv7mlyr&st=08q0ec2x&dl=0",
  "https://dl.dropboxusercontent.com/scl/fi/t5h8ie558cx950leh3rkh/IMG_4145.jpg?rlkey=o8dj4oczjorwtqkukzsreg2bo&st=c8njiggq&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/ws5bpet5zaox8kabl2hnl/IMG_4146.jpg?rlkey=xlbs3laraemt3k7v0dsjs3tms&st=rikq1e3q&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/5u9ume6cl1oqix0ugb9s2/IMG_4147.jpg?rlkey=u9zox1sn5tovwn955ogvr3upl&st=95ihdqa4&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/6hjyzb2cisrslacs032f9/IMG_4148.jpg?rlkey=gy3x0qrty7ikf4oeapuqfb1u0&st=uyqk3hj0&raw=1",
  "https://dl.dropboxusercontent.com/scl/fi/fr26qvfei8i1lg3cnarl5/IMG_4144.jpg?rlkey=gixb03g5nf2ojbfc7fwovxblk&st=d5rhmxge&raw=1",
  "https://www.dropbox.com/scl/fi/3x32nbgnfwnik94681i3k/11132f30-41b6-43f3-8ba3-b550d6dd07f5.JPG?rlkey=zy8v6sr9n30buwwp5jq8hvmfj&st=p0zykt8n&dl=0",
  "https://www.dropbox.com/scl/fi/xuwd8tltt4xvohdobw15n/IMG_9660.jpeg?rlkey=y25chzxtrvr09twja39o8vqk8&st=rctyph8r&dl=0",
];

const LETTERS: Letter[] = [
  {
    id: 1,
    title: "To My Dearest Aunty Dupe",
    content: "Happy birthday to my sweet aunty🎉❤️. May this new year of your life be filled with abundant blessings, good health, joy, peace, and countless reasons to smile. May God continue to guide and protect you, grant you the desires of your heart, and bless everything you do. May your days be long, beautiful, and filled with memorable moments surrounded by the people who love you. Thank you for being such an amazing aunty. I pray that this new chapter brings you greater happiness, success, and God's endless favour. Happy birthday once again, Aunty! 🎂🎊❤️ May you continue to shine and flourish in all that you do.",
    signature: "With All My Love, Toyosi"
  },
  {
    id: 2,
    title: "Happy Birthday My Sweet Aunty Dupe",
    content: "I wish you long life and prosperity in good health and peace of mind. I pray that the Almighty God would bring all your heart desires to pass according to His plan and purpose for your life in Jesus name. Thank you for all the love and kindness you show and for always being there. You have such a large heart and you are one of the sweetest person I know. I love you so much my sweet aunty Dupe. Enjoy your birthday, Ma!🥳 🫂❤️",
    signature: "Tomisin"
  },
  {
    id: 3,
    title: "Happy Birthday Aunty Dupsy of Life",
    content: "Happy birthday Ma. Wishing you long life and prosperity. Thank you for all that you do. Thank you for being best aunty ever. God bless you and God bless your new age. I wish you all the good things in life and I wish you a very lovely birthday celebration, even more lovely than you are and you are very lovely. God bless you and God bless everyone that you love and care about.",
    signature: "Dr Tobi"
  }
];

const AI_INSTRUCTION = `You are Aunty Dupe's personal birthday AI companion created specially for her by her nephew, Toyosi. 
Aunty Dupe (or Aunty Dupe) is an exceptionally kind, sweet, caring, and generous aunt celebrating her birthday. 
Your tone must be warm, respectful, affectionate, cheerful, and deeply appreciative. 
Always speak with the warmth and love that Toyosi feels for her as her grateful nephew. Express deep gratitude for how sweet, generous, and caring she has always been.
Address her affectionately as "Aunty Dupe", "Aunty Dupe", or "Aunty". 
NOTE: Speak naturally, warmly, and cheerfully about her birthday and how wonderful she is. Do NOT bring up or mention that you/Toyosi haven't met in person unless she specifically brings it up herself.
Keep replies concise, polite, heartfelt, and uplifting. 
Your primary goal is to make her feel deeply cherished, honored, and loved by her nephew Toyosi on her special birthday!`;

// --- END OF PERSONALIZATION SECTION ---

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentReason, setCurrentReason] = useState(REASONS[0]);
  const [showSurprise, setShowSurprise] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  const nextReason = () => {
    let next;
    do {
      next = REASONS[Math.floor(Math.random() * REASONS.length)];
    } while (next === currentReason && REASONS.length > 1);
    setCurrentReason(next);
  };

  const handleSurprise = () => {
    setShowSurprise(true);
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  // Auto-scroll chat
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const reply = await getHeartfeltReply(input, messages, AI_INSTRUCTION);
    setMessages(prev => [...prev, { role: 'model', parts: [{ text: reply! }] }]);
    setIsTyping(false);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-romantic-300">
      <AnimatePresence>
  {showSurprise && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-romantic-500 flex items-center justify-center text-center p-6"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowSurprise(false);
        }}
        className="absolute top-6 right-6 z-[250] flex items-center justify-center w-12 h-12 rounded-full bg-black/20 text-white/90 hover:bg-black/40 hover:text-white transition-all cursor-pointer"
        aria-label="Close surprise"
      >
        <X className="w-8 h-8" />
      </button>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 1 }}
      >
        <Heart className="w-24 h-24 text-white fill-white mx-auto mb-8 animate-pulse" />

        <h2 className="serif text-4xl md:text-7xl font-bold text-white mb-6">
          I love and appreciate you so much, Aunty Dupe!
        </h2>

        <p className="text-romantic-100 text-xl font-light italic">
          You are a true blessing to me.
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(240,90,90,0.05)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_rgba(240,90,90,0.05)_0%,_transparent_50%)]" />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black text-white">
        {/* Background Preloaded Fast Slideshow of Aunty Dupe */}
        <HeroSlideshow />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="z-10 max-w-4xl mx-auto px-4"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-6 inline-block"
          >
            <Heart className="w-16 h-16 text-romantic-400 fill-romantic-500 drop-shadow-md" />
          </motion.div>
          <h1 className="serif text-5xl sm:text-7xl md:text-8xl font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            Happy Birthday, <br />
            <span className="inline-block mt-4 md:mt-8 text-romantic-300 italic drop-shadow-md">{RHEMA_NAME}</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-100 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            A celebration of a soul that shines brighter than the sun. <br />
            Here's to the beauty you bring to every moment.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 z-10 animate-bounce"
        >
          <ChevronDown className="w-8 h-8 text-white/80" />
        </motion.div>

        {/* Floating Hearts Decor */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute z-0 text-romantic-200"
            animate={{
              y: [0, -100, -200],
              x: [0, Math.sin(i) * 50, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear"
            }}
            style={{
              left: `${15 + i * 15}%`,
              bottom: "-5%"
            }}
          >
            <Heart className="w-4 h-4 fill-current" />
          </motion.div>
        ))}
      </section>

      {/* Reasons Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white/40 backdrop-blur-md border border-romantic-100 p-10 md:p-16 rounded-[40px] shadow-xl"
          >
            <div className="mb-8 inline-flex items-center justify-center w-12 h-12 bg-romantic-100 rounded-full">
              <Heart className="w-6 h-6 text-romantic-500 fill-romantic-500" />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.p
                key={currentReason}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="serif text-2xl md:text-3xl italic text-gray-800 leading-relaxed mb-10 h-[100px] flex items-center justify-center px-4"
              >
                "{currentReason}"
              </motion.p>
            </AnimatePresence>

            <button
              onClick={nextReason}
              className="group relative px-8 py-4 bg-gray-900 text-white rounded-full font-semibold overflow-hidden transition-all hover:pr-12 active:scale-95 shadow-lg"
            >
              <span className="relative z-10 italic">Click for a reason why I love you, Aunty</span>
              <Heart className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-romantic-300 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Photobook Section - Authentic Polaroid Memory Collage */}
      <section className="py-24 relative z-10 overflow-hidden bg-[#FAF8F5] border-y border-amber-100/60">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 text-center md:text-left">
            <div>
              <span className="text-xs uppercase font-semibold tracking-widest text-romantic-500 bg-romantic-50 px-4 py-1.5 rounded-full border border-romantic-100/80 inline-block mb-3">
                ✦ Memory Gallery ✦
              </span>
              <h2 className="serif text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight">Your Photobook</h2>
              <p className="text-gray-600 mt-2 italic font-light">A cherished collection of moments celebrating you, {RHEMA_NAME}.</p>
            </div>
          </div>

          {/* Mixed Size Authentic Polaroid Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 items-center">
            {PHOTO_DUMP.map((url, i) => {
              // Dynamic polaroid aspect ratio, span, tilt, and tape placement
              const pattern = i % 6;
              let colSpanClass = "col-span-1";
              let aspectClass = "aspect-[4/5]";
              let rotationClass = "rotate-1";
              let paddingClass = "p-3.5 pb-11";
              const showTape = i % 3 === 0;
              const tapeRotation = i % 2 === 0 ? "-rotate-3" : "rotate-2";

              if (pattern === 0) {
                // Featured Large Polaroid
                colSpanClass = "col-span-1 sm:col-span-2";
                aspectClass = "aspect-[4/3] sm:aspect-[16/11]";
                rotationClass = "-rotate-1 sm:-rotate-2";
                paddingClass = "p-4 pb-8";
              } else if (pattern === 1) {
                // Tall Portrait Polaroid
                aspectClass = "aspect-[3/4]";
                rotationClass = "rotate-2";
                paddingClass = "p-3 pb-7";
              } else if (pattern === 2) {
                // Classic Square Polaroid
                aspectClass = "aspect-square";
                rotationClass = "-rotate-3";
                paddingClass = "p-3.5 pb-8";
              } else if (pattern === 3) {
                // Wide Landscape Polaroid
                colSpanClass = "col-span-1 sm:col-span-2";
                aspectClass = "aspect-[16/10]";
                rotationClass = "rotate-2 sm:rotate-1";
                paddingClass = "p-4 pb-8";
              } else if (pattern === 4) {
                // Medium Soft Portrait
                aspectClass = "aspect-[4/5]";
                rotationClass = "-rotate-2";
                paddingClass = "p-3.5 pb-7";
              } else {
                // Slightly Tilted Square
                aspectClass = "aspect-[4/5]";
                rotationClass = "rotate-3";
                paddingClass = "p-3.5 pb-7";
              }

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: i * 0.04,
                    type: "spring",
                    stiffness: 90,
                    damping: 15
                  }}
                  className={`group relative bg-[#FCFAF7] rounded-xl shadow-[0_10px_28px_-6px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_22px_45px_-8px_rgba(240,90,90,0.22)] border border-[#EFE9DF] transition-all duration-500 hover:rotate-0 hover:scale-[1.03] hover:z-20 flex flex-col ${colSpanClass} ${paddingClass} ${rotationClass}`}
                >
                  {/* Decorative Washi Tape Accent */}
                  {showTape && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#F3E8D3]/80 border border-[#E2D4B8]/80 shadow-2xs backdrop-blur-xs z-30 pointer-events-none rounded-xs ${tapeRotation}`} />
                  )}

                  {/* Inner Photo Frame */}
                  <div className={`w-full ${aspectClass} overflow-hidden rounded-lg relative bg-neutral-100 shadow-inner border border-black/5`}>
                    <PhotobookImage url={url} index={i} fitMode="cover" />
                  </div>

                  {/* Polaroid Frame Footer */}
                  <div className="mt-2.5 flex items-center justify-end px-1">
                    <Heart className="w-3.5 h-3.5 text-romantic-300 opacity-30 group-hover:opacity-100 group-hover:scale-110 group-hover:text-romantic-500 transition-all duration-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Message Section */}
      <VideoMessageSection />

      {/* Letters Section */}
      <section className="py-24 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-12">
            <BookOpen className="w-8 h-8 text-romantic-500" />
            <h2 className="serif text-3xl md:text-4xl font-bold text-gray-900">From the Heart</h2>
          </div>

          <div className="space-y-16">
            {LETTERS.map((letter, i) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -8,
                  transition: { type: "spring", stiffness: 300, damping: 20 } 
                }}
                viewport={{ once: true }}
                className="relative bg-white p-10 md:p-16 rounded-[40px] shadow-2xl shadow-romantic-100/50 border border-romantic-100 cursor-default group"
              >
                <h3 className="serif text-2xl md:text-3xl mb-6 text-romantic-500 italic group-hover:text-romantic-600 transition-colors">"{letter.title}"</h3>
                <p className="text-lg md:text-xl text-gray-700 font-light leading-loose mb-8">
                  {letter.content}
                </p>
                <div className="text-right">
                  <p className="serif text-xl italic font-semibold text-gray-900">-{letter.signature}</p>
                </div>
                <motion.div 
                  whileHover={{ rotate: 180 }}
                  className="absolute -top-4 -left-4 w-12 h-12 bg-romantic-100 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-romantic-500" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-24 bg-romantic-100/30 relative z-10 border-t border-romantic-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4 ring-4 ring-romantic-200">
              <MessageCircle className="w-8 h-8 text-romantic-500" />
            </div>
            <h2 className="serif text-3xl font-bold mb-2">A birthday AI just for Aunty Dupe</h2>
            <p className="text-gray-600 max-w-xl mx-auto font-light">A personal AI created by your nephew Toyosi just for you, {RHEMA_NAME}. Your sweet kindness and warmth mean the absolute world to me.</p>
          </div>

          <div className="glass rounded-[32px] overflow-hidden flex flex-col h-[500px] shadow-2xl border border-white">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll bg-white/20">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <Stars className="w-10 h-10 mb-3 text-romantic-400 opacity-60" />
                  <p className="serif text-lg italic text-gray-600 font-medium">Say hello to your personal Birthday AI from Toyosi...</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">Ask anything, share a prayer, or chat about your special day!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-5 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-romantic-500 text-white shadow-lg'
                        : 'bg-white/80 text-gray-800 shadow-sm border border-romantic-100'
                    }`}
                  >
                    <div className="markdown-body prose prose-sm prose-romantic max-w-none">
                      <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start px-4 italic text-romantic-400 text-sm animate-pulse serif"
                >
                  Finding the perfect words for you...
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/50 border-t border-romantic-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={`Type a message for ${RHEMA_NAME}...`}
                  className="flex-1 bg-white px-6 py-3 rounded-full border border-romantic-200 focus:outline-none focus:ring-2 focus:ring-romantic-400 transition-all text-gray-800 font-light"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 flex items-center justify-center bg-romantic-500 text-white rounded-full hover:bg-romantic-600 transition-all disabled:bg-romantic-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Surprise Section */}
      <section className="py-24 bg-white relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto px-4"
        >
          <div className="p-12 rounded-[40px] border-2 border-dashed border-romantic-200 bg-romantic-50/30">
             <Stars className="w-10 h-10 text-romantic-400 mx-auto mb-6" />
             <h2 className="serif text-2xl font-bold mb-8 text-gray-800">Curiosity killed the cat... but check this out.</h2>
             <button
               onClick={handleSurprise}
               className="px-10 py-5 bg-romantic-500 text-white rounded-full font-bold text-lg shadow-xl hover:bg-romantic-600 hover:scale-105 active:scale-95 transition-all"
             >
               Don't click this... 🎁
             </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white text-center border-t border-romantic-100 relative z-10">
        <p className="serif italic text-gray-400">Made with a heart full of love for {RHEMA_NAME}.</p>
        <p className="text-xs text-romantic-300 uppercase tracking-widest mt-2">{new Date().getFullYear()} Special Edition</p>
      </footer>
    </div>
  );
}
