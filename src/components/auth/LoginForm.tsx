import React from 'react';
import { SignIn } from '@clerk/clerk-react';

export const LoginForm = () => {
  return (
    <div className="w-full flex justify-center bg-transparent">
      <SignIn 
        signUpUrl="/register"
        fallbackRedirectUrl="/chat"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-gray-200 dark:border-slate-800",
            headerTitle: "text-black dark:text-white",
            headerSubtitle: "text-gray-500 dark:text-gray-400",
            formFieldLabel: "text-black dark:text-white",
            formFieldInput: "bg-white dark:bg-slate-950 border-gray-300 dark:border-slate-700 text-black dark:text-white rounded-xl h-11",
            formButtonPrimary: "bg-black dark:bg-[#4ADE80] text-white dark:text-black hover:bg-black/90 dark:hover:bg-[#22C55E] h-11 rounded-xl font-bold",
            footerActionLink: "text-[#9AC68A] dark:text-[#4ADE80] hover:text-[#8AB67A] dark:hover:text-[#22C55E]",
            dividerLine: "bg-gray-200 dark:bg-slate-800",
            dividerText: "text-gray-500 dark:text-gray-400",
            socialButtonsBlockButton: "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-black dark:text-white rounded-xl h-11",
            socialButtonsBlockButtonText: "font-semibold",
          }
        }}
      />
    </div>
  );
};
