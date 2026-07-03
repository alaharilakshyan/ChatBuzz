import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, Zap, Shield, ArrowRight, Sparkles, Ghost, Hexagon, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Instant message delivery with organic websocket connections for seamless communication.",
      gradient: "from-[#a8d5ba] to-[#88c5a6]" // Sage greens
    },
    {
      icon: Ghost,
      title: "Ephemeral Mode",
      description: "Snapchat-style disappearing messages for private, temporary conversations.",
      gradient: "from-[#f4d06f] to-[#ffb627]" // Yellows
    },
    {
      icon: Hexagon,
      title: "Workspace Fabric",
      description: "Discord-style servers, channels, and threaded replies for robust community building.",
      gradient: "from-[#a0c4ff] to-[#73a5ff]" // Soft Blues
    },
    {
      icon: Fingerprint,
      title: "End-to-end Secure",
      description: "Military-grade encryption securing every text, image, and voice note.",
      gradient: "from-[#e4c1f9] to-[#d0a5f9]" // Soft Purples
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 100, damping: 15 } 
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col font-sans overflow-x-hidden selection:bg-primary/20">
      
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-gradient-to-b from-[#a8d5ba]/20 via-[#a0c4ff]/10 to-transparent blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 py-16 sm:py-24 max-w-7xl mx-auto w-full gap-12 lg:gap-8">
        
        {/* Hero Content */}
        <motion.div 
          className="flex-1 space-y-8 lg:pr-10 text-center lg:text-left z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-black/5 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#88c5a6]" />
            <span className="text-sm font-semibold tracking-wide text-zinc-600">The Next Generation of Communication</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-zinc-900">
            Communicate with <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#88c5a6] via-[#6ba58b] to-[#a0c4ff]">
              Absolute Fluidity.
            </span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            A premium, ultra-fast chat experience fusing the best of Discord, Instagram, and Snapchat. 
            Beautifully designed, effortlessly intuitive.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-white border-0 px-8 py-7 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              <Link to="/chat">
                Start Chatting
                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto border-zinc-200 bg-white/50 backdrop-blur-md hover:bg-white hover:border-zinc-300 px-8 py-7 text-lg rounded-2xl transition-all duration-300 shadow-sm"
            >
              Explore Features
            </Button>
          </motion.div>

          {/* User Welcome */}
          {user && (
            <motion.div variants={itemVariants} className="mt-8 p-5 rounded-2xl bg-white/60 backdrop-blur-xl border border-zinc-100 max-w-md mx-auto lg:mx-0 shadow-sm">
              <p className="text-base font-medium text-zinc-700">
                Welcome back, <span className="font-bold text-[#88c5a6]">{user.username}</span>! 
                Your workspaces are ready.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Hero Image / Interactive Element */}
        <motion.div 
          className="flex-1 w-full max-w-md lg:max-w-none relative z-10"
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#a8d5ba]/30 border-8 border-white/50 backdrop-blur-sm group">
            <img 
              src="/hero-image.jpg" 
              alt="Talk Time App Interface" 
              className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
            />
            {/* Floating UI Elements Overlay */}
            <motion.div 
              className="absolute top-10 -left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 flex items-center gap-3"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f4d06f] to-[#ffb627] flex items-center justify-center">
                <Ghost className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">Ephemeral</p>
                <p className="text-xs text-zinc-500">Mode activated</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="absolute bottom-10 -right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-black/5 flex items-center gap-3"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#88c5a6] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800">New Message</p>
                <p className="text-xs text-zinc-500">Just now</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-8 relative bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
              Crafted for Modern Teams
            </h2>
            <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
              A meticulously designed fabric of features that adapts to how you naturally converse.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-white border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="space-y-6 pt-8 px-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-zinc-800">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <CardDescription className="text-zinc-500 text-base leading-relaxed font-medium">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-4 sm:px-8 bg-white relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#a8d5ba]/20 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="bg-white/60 backdrop-blur-2xl border border-white shadow-2xl p-8 sm:p-12 rounded-[3rem]">
              <CardContent className="space-y-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#88c5a6] flex items-center justify-center shadow-lg mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight">
                  Ready to evolve your <br/> communication?
                </h3>
                <p className="text-lg sm:text-xl text-zinc-500 font-medium max-w-lg mx-auto">
                  Join the next generation of conversational fabric with ChatBuzz.
                </p>
                <Button 
                  asChild 
                  size="lg"
                  className="bg-[#88c5a6] hover:bg-[#73a58b] text-white border-0 px-10 py-7 text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 mt-4"
                >
                  <Link to="/chat">
                    Enter Application
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
      
    </div>
  );
};

export default Index;
