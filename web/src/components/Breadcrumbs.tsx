import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs md:text-sm mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <Link 
        to="/" 
        className="flex items-center text-neutral-400 hover:text-brand transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5 md:w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-x-1.5 min-w-0 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
          {item.path ? (
            <Link 
              to={item.path} 
              className="font-medium text-neutral-400 hover:text-brand transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className="font-bold text-brand truncate max-w-[140px] md:max-w-none inline-block align-middle"
              title={item.label}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
