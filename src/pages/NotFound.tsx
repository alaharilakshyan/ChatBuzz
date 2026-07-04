import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-destructive/10 to-transparent rounded-full blur-[80px] pointer-events-none" />

      <motion.div 
        className="text-center relative z-10 space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-24 h-24 rounded-[2rem] bg-card border shadow-elegant flex items-center justify-center mx-auto">
          <MessageCircle className="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-8xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">
            404
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto text-lg">
            The conversation you're looking for seems to have vanished into the ether.
          </p>
        </div>

        <Button asChild size="lg" className="h-12 px-8 rounded-xl shadow-md hover:shadow-lg transition-all group">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Safety
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
