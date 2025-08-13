import { Loader2 } from "lucide-react";

export default function Loading({ screen }) {
  return (
    <div className={`flex ${screen ? "h-screen" : "h-auto"} items-center justify-center`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 font-text">Loading...</span>
    </div>
  );
}