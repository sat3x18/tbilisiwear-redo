import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import notFoundImage from "@/assets/404-model.jpg";

const NotFound = () => {
  const location = useLocation();
  const { settings } = useStoreSettings();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Content */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-lg text-center lg:text-left">
          <Link to="/" className="inline-block mb-8">
            <h1 className="font-display text-2xl text-foreground">
              {settings.store_name}
            </h1>
          </Link>
          
          <div className="mb-8">
            <span className="text-8xl lg:text-9xl font-display font-medium text-primary/20">
              404
            </span>
          </div>
          
          <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground font-body text-lg mb-8">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/shop">
                <ArrowLeft className="w-4 h-4" />
                Browse Shop
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src={notFoundImage} 
          alt="Fashion model" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-background/30" />
      </div>
    </div>
  );
};

export default NotFound;