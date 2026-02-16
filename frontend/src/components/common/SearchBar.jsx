import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Search, Filter, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search...', icon = true }) => {
  return (
    <div className="relative">
      {icon && (
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          icon ? 'pl-12' : ''
        }`}
      />
    </div>
  );
};

export default SearchBar;
