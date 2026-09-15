"use client";

import Link from "next/link";

const Logo = () => {
  return (
    <div>
      <Link href="/" className="">
        <img className="w-14 h-14" src="/logo.png" alt="sporty pulse" />
      </Link>
    </div>
  );
};
export default Logo;
