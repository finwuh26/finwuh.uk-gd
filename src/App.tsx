import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring, useMotionValue } from 'motion/react';
import { ArrowUpRight, Mail, X, Share2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

type Project = {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
};

const PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Gridlock Racing League',
    category: 'Brand Identity',
    image: 'https://www.finwuh.uk/gridlock.png',
    description: 'A complete brand identity package for a competitive sim-racing league, focusing on speed, precision, and modern motorsport aesthetics.',
  },
  {
    id: 2,
    title: 'JakeZR',
    category: 'Streamer Identity',
    image: 'https://www.finwuh.uk/jakezr.png',
    description: 'A dynamic and engaging visual identity for a motorsport content creator, designed to stand out across streaming platforms and social media.',
  },
  {
    id: 3,
    title: 'BMW Poster',
    category: 'Mockup Poster',
    image: 'https://www.finwuh.uk/bmw.png',
    description: 'An editorial-style poster design celebrating the engineering and aggressive styling of BMW vehicles.',
  },
  {
    id: 4,
    title: 'Lando Norris Pole Poster',
    category: 'Poster Graphic',
    image: 'https://www.finwuh.uk/norris.png',
    description: 'A commemorative graphic design piece capturing the energy and excitement of Lando Norris securing pole position.',
  },
];

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: string[]; 
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        className={`w-full bg-white/5 border rounded-xl px-4 py-4 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'border-white/20 bg-white/10' : 'border-white/5'} ${value ? 'text-white' : 'text-white/30'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-white' : 'text-white/30'}`}><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 w-full mt-2 bg-ink border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col origin-top overflow-hidden p-2"
          >
            {options.map(opt => (
              <div
                key={opt}
                className="px-4 py-3 rounded-lg hover:bg-white/5 cursor-pointer text-white/60 hover:text-white transition-colors text-sm"
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactForm, setContactForm] = useState({ 
    name: '', 
    email: '', 
    projectType: '',
    customProjectType: '',
    budget: '',
    customBudget: '',
    message: '' 
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [contactMethod, setContactMethod] = useState<'email' | 'discord'>('email');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState<number | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProject]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleShare = async (project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = 'https://finwuh.uk';
    const text = `Check out this project by Fin: ${project.title}\n${url}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedProjectId(project.id);
      setTimeout(() => setCopiedProjectId(null), 2000);
    } catch (err) {
      window.location.href = `mailto:?subject=${encodeURIComponent(`Project by Fin: ${project.title}`)}&body=${encodeURIComponent(text)}`;
    }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProjectType = contactForm.projectType === 'Custom' ? contactForm.customProjectType : contactForm.projectType;
    const finalBudget = contactForm.budget === 'Custom' ? contactForm.customBudget : contactForm.budget;

    if (!finalProjectType || !finalBudget) {
      alert("Please select a project type and budget.");
      return;
    }

    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("Discord webhook URL is not configured.");
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 5000);
      return;
    }

    const payload = {
      content: "@everyone",
      embeds: [{
        title: "🚀 New Project Inquiry",
        color: 15085101, // #E62E2D Racing Red
        fields: [
          { name: "👤 Name", value: contactForm.name, inline: true },
          { name: contactMethod === 'email' ? "📧 Email" : "💬 Discord", value: contactForm.email, inline: true },
          { name: "📁 Project Type", value: finalProjectType, inline: true },
          { name: "💰 Budget", value: finalBudget, inline: true },
          { name: "📝 Details & Timeline", value: contactForm.message }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    // Fire and forget for instant UI feedback
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(console.error);

    // Instant success state
    setSubmitStatus('success');
    setContactForm({ name: '', email: '', projectType: '', customProjectType: '', budget: '', customBudget: '', message: '' });
    setTimeout(() => setSubmitStatus('idle'), 5000);
  };

  return (
    <div id="top" className="min-h-screen bg-ink text-paper selection:bg-racing-red selection:text-white overflow-hidden">
      {/* Custom Cursor / Subtle Glow */}
      <motion.div 
        className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] -ml-[300px] -mt-[300px] z-50 rounded-full mix-blend-screen"
        style={{
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)`,
          x: smoothX,
          y: smoothY,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-6 md:px-12 bg-ink/90 backdrop-blur-md border-b border-white/5">
        <motion.a 
          href="#top"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-1.5 group"
        >
          <span className="text-3xl font-medium tracking-tight lowercase text-white/90 group-hover:text-white transition-colors">
            fin.
          </span>
        </motion.a>
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-8 text-sm font-medium text-white/50 tracking-wide"
        >
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#work" className="hover:text-white transition-colors">Work</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </motion.div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex flex-col justify-center px-6 md:px-12 pt-20">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="text-[12vw] md:text-[8vw] lg:text-[6vw] xl:text-[5.5rem] leading-[0.85] font-medium tracking-tighter"
              >
                I design.<br />
                <span className="text-white/40">I innovate.</span><br />
                I create.
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="h-[1px] bg-gradient-to-r from-white/20 to-transparent max-w-md mt-12"
              />
            </div>

            {/* Right side visual showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-lg ml-auto"
            >
              <div 
                className="col-span-2 aspect-[21/9] bg-white/5 border border-white/5 rounded-3xl overflow-hidden relative group cursor-pointer"
                onClick={() => setSelectedProject(PROJECTS[0])}
              >
                <img src={PROJECTS[0].image} alt="Work" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-ink/40 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-widest font-medium text-white px-6 py-3 rounded-full bg-black/60 shadow-xl border border-white/10">View Project</span>
                </div>
              </div>
              <div 
                className="aspect-square bg-white/5 border border-white/5 rounded-3xl overflow-hidden relative group cursor-pointer"
                onClick={() => setSelectedProject(PROJECTS[1])}
              >
                <img src={PROJECTS[1].image} alt="Work" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-ink/40 backdrop-blur-sm">
                  <span className="text-xs uppercase tracking-widest font-medium text-white px-6 py-3 rounded-full bg-black/60 shadow-xl border border-white/10">View Project</span>
                </div>
              </div>
              <a 
                href="#work"
                className="aspect-square bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl overflow-hidden relative group flex flex-col items-center justify-center p-6 text-center transition-colors duration-500"
              >
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white transition-colors duration-500">
                  <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-ink transition-colors duration-500" />
                </div>
                <span className="text-sm font-medium tracking-wide text-white/40 group-hover:text-white transition-colors duration-500">Explore<br/>Portfolio</span>
              </a>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-32 px-6 md:px-12 border-t border-white/10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 md:gap-20">
            {/* Left decorative element */}
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              whileInView={{ opacity: 1, height: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="hidden md:flex flex-col items-center mt-2"
            >
              <div className="w-[1px] h-32 bg-gradient-to-b from-transparent to-white/20"></div>
              <div className="my-6 text-xs font-medium text-white/20 tracking-[0.2em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
                BACKGROUND
              </div>
              <div className="w-[1px] h-32 bg-gradient-to-b from-white/20 to-transparent"></div>
            </motion.div>

            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-xs font-medium uppercase tracking-widest text-white/30 mb-8">About</h2>
              <p className="text-2xl md:text-3xl leading-relaxed font-light text-white/90">
                I'm Fin, a graphic designer based in the UK. Growing up around motorsports has shaped how I approach my work. Fast, sharp, and strictly no nonsense.
              </p>
              <p className="mt-8 text-lg text-white/50 font-light max-w-2xl">
                I focus on creating high quality visuals that genuinely stand out. Whether it is a full brand identity or just a single poster, my goal is to make things that look good and do their job perfectly.
              </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="work" className="py-32 px-6 md:px-12 border-t border-white/10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-16 flex justify-between items-end"
          >
            <h2 className="text-xs font-medium uppercase tracking-widest text-white/30">Selected Work</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            {PROJECTS.map((project, index) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`group cursor-pointer ${index % 2 !== 0 ? 'md:mt-32' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <div className="relative overflow-hidden bg-white/5 aspect-[3/2] rounded-3xl mb-6">
                  <motion.img 
                    style={{ y, WebkitFontSmoothing: 'antialiased' }}
                    src={project.image} 
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className="absolute -top-[5%] left-0 w-full h-[110%] object-cover opacity-80 group-hover:opacity-100 transition-all duration-[1.5s] ease-out group-hover:scale-[1.02] origin-center"
                  />
                  <div className="absolute inset-0 bg-ink/20 group-hover:bg-transparent transition-colors duration-[1.5s] ease-out pointer-events-none" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-medium tracking-tight group-hover:text-white transition-colors duration-500">
                      {project.title}
                    </h3>
                    <p className="text-sm text-white/40 mt-1">
                      {project.category}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleShare(project, e)}
                    className="p-2 -mt-1 -mr-2 text-white/20 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Share project"
                  >
                    {copiedProjectId === project.id ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 px-6 md:px-12 border-t border-white/10 min-h-[70vh] flex flex-col justify-center">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-xs font-medium uppercase tracking-widest text-white/30 mb-8">Start a Project</h2>
              <h3 className="text-[10vw] md:text-[5vw] leading-[0.9] font-medium tracking-tighter mb-12">
                Let's build something <br/>
                <span className="text-white/40 hover:text-white transition-colors duration-500 cursor-default">beautiful.</span>
              </h3>
              
              <a 
                href="mailto:contact@finwuh.uk" 
                className="inline-flex items-center gap-4 text-xl md:text-2xl border-b border-white/10 pb-2 hover:border-white transition-colors duration-300 group"
              >
                <Mail className="w-6 h-6 text-white/30 group-hover:text-white transition-colors" />
                contact@finwuh.uk
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full max-w-md md:ml-auto mt-12 md:mt-0"
            >
              <form className="flex flex-col gap-6" onSubmit={handleContactSubmit}>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
                  <input 
                    type="text" 
                    id="name" 
                    placeholder="Name" 
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all peer" 
                    required 
                  />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative">
                  <input 
                    type={contactMethod === 'email' ? "email" : "text"}
                    id="email" 
                    placeholder={contactMethod === 'email' ? "Email" : "Discord Username"}
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setTimeout(() => setIsEmailFocused(false), 200)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all peer" 
                    required 
                  />
                  <AnimatePresence>
                    {isEmailFocused && (
                      <motion.button
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        type="button"
                        onClick={() => {
                          setContactMethod(contactMethod === 'email' ? 'discord' : 'email');
                          setContactForm({ ...contactForm, email: '' });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-widest text-white/50 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg border border-white/5"
                      >
                        Use {contactMethod === 'email' ? 'Discord Username' : 'Email'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-4">
                    <CustomSelect 
                      value={contactForm.projectType}
                      onChange={(val) => setContactForm({ ...contactForm, projectType: val })}
                      options={['Brand Identity', 'Streamer Graphics', 'Poster / Editorial', 'Merchandise', 'Other', 'Custom']}
                      placeholder="Project Type"
                    />
                    <AnimatePresence>
                      {contactForm.projectType === 'Custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative overflow-hidden"
                        >
                          <input 
                            type="text" 
                            placeholder="Specify Project Type" 
                            value={contactForm.customProjectType}
                            onChange={(e) => setContactForm({ ...contactForm, customProjectType: e.target.value })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm mt-3" 
                            required 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col gap-4">
                    <CustomSelect 
                      value={contactForm.budget}
                      onChange={(val) => setContactForm({ ...contactForm, budget: val })}
                      options={['< £50', '£50 - £150', '£150 - £300', '£300+', 'Custom']}
                      placeholder="Est. Budget"
                    />
                    <AnimatePresence>
                      {contactForm.budget === 'Custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative overflow-hidden"
                        >
                          <input 
                            type="text" 
                            placeholder="Specify Budget" 
                            value={contactForm.customBudget}
                            onChange={(e) => setContactForm({ ...contactForm, customBudget: e.target.value })}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm mt-3" 
                            required 
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative">
                  <textarea 
                    id="message" 
                    placeholder="Project Details & Timeline" 
                    rows={4} 
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all peer resize-none" 
                    required
                  ></textarea>
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center gap-4">
                  <button 
                    type="submit" 
                    className="self-start px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium text-sm transition-colors duration-300"
                  >
                    Request Quote
                  </button>

                  <AnimatePresence>
                    {submitStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-emerald-400 text-sm font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Sent successfully
                      </motion.div>
                    )}
                    {submitStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm font-medium"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Failed to send
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <div className="mt-2 flex items-center gap-3 text-xs font-medium text-white/40 uppercase tracking-widest">
                  <span>or dm</span>
                  <a href="https://discord.com/users/finwuh" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-current">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    finwuh
                  </a>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center text-xs font-medium text-white/40 uppercase tracking-widest border-t border-white/5">
        <p>© 2026 Fin All rights reserved.</p>
        <p className="mt-4 md:mt-0 flex items-center gap-2">
          Based in the UK
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-5 h-auto ml-1 rounded-[2px] overflow-hidden">
            <clipPath id="t">
              <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
            </clipPath>
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </svg>
        </p>
      </footer>

      {/* Project Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-ink/90 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-ink border border-white/10 shadow-2xl flex flex-col md:flex-row"
          >
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-racing-red text-white rounded-full backdrop-blur-md transition-colors duration-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-full md:w-2/3 bg-black/50 aspect-[3/2] md:aspect-auto">
              <img 
                src={selectedProject.image} 
                alt={selectedProject.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col justify-center">
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">
                {selectedProject.category}
              </p>
              <h3 className="text-3xl font-medium tracking-tight mb-6">
                {selectedProject.title}
              </h3>
              <p className="text-white/60 font-light leading-relaxed mb-8">
                {selectedProject.description}
              </p>
              
              <button
                onClick={() => handleShare(selectedProject)}
                className="inline-flex items-center gap-3 self-start px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium text-xs tracking-wide transition-colors duration-300"
              >
                {copiedProjectId === selectedProject.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share Project
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
