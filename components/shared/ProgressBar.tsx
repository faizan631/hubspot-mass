// components/shared/ProgressBar.tsx
"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const CustomProgressBar = () => {
  const pathname = usePathname();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [pathname]);

  return (
    <ProgressBar
      key={key}
      height="4px"
      color="#4f46e5"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
};

export default CustomProgressBar;
