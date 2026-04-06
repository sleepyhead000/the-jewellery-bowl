interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className = "", label, error, id, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide mb-2">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-300 resize-y min-h-[100px] ${
          error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-black"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
