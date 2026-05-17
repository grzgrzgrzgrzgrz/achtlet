import React from "react";

interface AchtletLogoProps {
  size?: number;
  className?: string;
}

const AchtletLogo: React.FC<AchtletLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <img
      src="/icons/app-icon.svg"
      alt="Achtlet logo"
      className={className}
      width={size}
      height={size}
      style={{
        objectFit: "contain",
        borderRadius: "12px",
      }}
    />
  );
};

export default AchtletLogo;
