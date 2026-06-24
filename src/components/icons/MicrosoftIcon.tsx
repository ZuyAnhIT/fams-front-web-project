import React from 'react';

/**
 * MicrosoftIcon - Logo Microsoft 4-color window SVG.
 * Nhận các props cơ bản của thẻ SVG để có thể custom kích thước hoặc class từ bên ngoài.
 */
const MicrosoftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 23 23" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="10.5" height="10.5" fill="#F25022" />
      <rect x="12" width="10.5" height="10.5" fill="#7FBA00" />
      <rect y="12" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12" y="12" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
};

export default MicrosoftIcon;
