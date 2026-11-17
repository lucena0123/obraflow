import Image from "next/image";

/** Original RLM artwork, served from the same origin in local and Pages builds. */
export function RlmLogo({
  variant = "color",
  className = "",
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  return (
    <Image
      src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/brand/logo-${variant === "white" ? "branco" : "cor"}.svg`}
      width={261}
      height={121}
      alt="RLM Soluções Industriais"
      className={`rlm-logo ${className}`}
      loading="eager"
      unoptimized
    />
  );
}
