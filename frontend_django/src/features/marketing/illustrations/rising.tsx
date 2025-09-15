import Glow from "@/shared/ui/glow";

const RisingIllustration: React.FC = () => {
  return (
    <div className="group relative w-full pt-[50%]">
      <div className="absolute left-0 top-0 z-10 w-full overflow-hidden rounded-[100%] border-4 border-brand bg-background/50 pt-[100%] shadow-[0px_0px_12px_hsla(var(--brand)/0.8),_0px_0px_64px_hsla(var(--brand-foreground)/0.5),0px_0px_12px_hsla(var(--brand)/0.8)_inset]">
        <div
          className="absolute left-0 top-0 h-full w-full rounded-[100%] bg-brand-foreground/50 group-hover:animate-pulse-hover"
          style={{
            maskImage:
              "radial-gradient(140% 95%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="absolute left-0 top-0 h-full w-full rounded-[100%] bg-brand/50 group-hover:animate-pulse-hover"
          style={{
            maskImage:
              "radial-gradient(140% 110%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="absolute left-0 top-0 h-full w-full rounded-[100%] bg-white group-hover:animate-pulse-hover"
          style={{
            maskImage:
              "radial-gradient(140% 120%, transparent 0%, transparent 38%, black 43%)",
          }}
        />
      </div>
      <Glow variant="center" />
    </div>
  );
};

export default RisingIllustration;
