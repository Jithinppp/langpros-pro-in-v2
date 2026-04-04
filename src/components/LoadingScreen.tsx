import Loading from "./Loading";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loading className="w-10 h-10 text-[#1769ff] mb-4" />
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}
