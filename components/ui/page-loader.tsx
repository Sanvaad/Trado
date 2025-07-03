"use client";

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-8 text-center border border-zinc-800">
        <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
        <p className="text-white text-lg font-medium mb-2">{message}</p>
        <p className="text-zinc-400 text-sm">Please wait...</p>
      </div>
    </div>
  );
}

export function InlineLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex-1 bg-black text-white flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">{message}</h2>
        <p className="text-zinc-400">Please wait while we load the content...</p>
      </div>
    </div>
  );
}