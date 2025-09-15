const Notion = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M24,21.45V25a2.0059,2.0059,0,0,1-2,2H9V21h9V16Z"
      fill="currentColor"
      opacity={0.7}
    />
    <polygon
      fill="currentColor"
      opacity={0.7}
      points="24 11 24 21.45 18 16 18 11 24 11"
    />
    <polygon fill="currentColor" opacity={1} points="9 5 9 11 3 11 9 5" />
    <rect
      fill="currentColor"
      opacity={0.7}
      height={11}
      width={6}
      x={3}
      y={11}
    />
    <path
      d="M24,7v4h-.5L18,16V11H9V5H22A2.0059,2.0059,0,0,1,24,7Z"
      fill="currentColor"
      opacity={0.7}
    />
    <path
      d="M9,21v6H5a2.0059,2.0059,0,0,1-2-2V21Z"
      fill="currentColor"
      opacity={1}
    />
    <path
      d="M29,8.26V23.74a.9989.9989,0,0,1-1.67.74L24,21.45,18,16l5.5-5,.5-.45,3.33-3.03A.9989.9989,0,0,1,29,8.26Z"
      fill="currentColor"
      opacity={0.7}
    />
    <polygon
      fill="currentColor"
      opacity={1}
      points="24 10.55 24 21.45 18 16 23.5 11 24 10.55"
    />
  </svg>
);
export default Notion;
