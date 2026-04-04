interface LoadingProps {
  className?: string;
  color?: string;
}

const Loading = ({ className = "h-5 w-5", color = "border-slate-400" }: LoadingProps) => {
  return (
    <div className={`inline-block ${className}`}>
      <div className={`w-full h-full border-2 ${color} border-t-transparent rounded-full animate-spin`} />
    </div>
  );
};

export default Loading;