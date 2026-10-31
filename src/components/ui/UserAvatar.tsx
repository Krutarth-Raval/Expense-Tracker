"use client";

import React from "react";
import { User } from "lucide-react";

interface UserAvatarProps {
  initials?: string;
  name?: string;
  imageUrl?: string;
  onClick?: () => void;
}

export function UserAvatar({
  initials = "KR",
  name = "User Profile",
  imageUrl,
  onClick,
}: UserAvatarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      className="relative w-10 h-10 squircle rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 border border-black/10 dark:border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-150 overflow-hidden"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover grayscale contrast-125"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-black dark:text-white">
          {initials ? (
            <span className="text-xs font-semibold tracking-wider font-mono">
              {initials}
            </span>
          ) : (
            <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" strokeWidth={1.8} />
          )}
        </div>
      )}
      
      {/* Monochrome status indicator dot */}
      <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-black dark:bg-white ring-2 ring-white dark:ring-neutral-900" />
    </button>
  );
}
